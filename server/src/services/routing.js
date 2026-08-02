import { cacheGet, cacheSet, TTL, roundCoord } from './cache.js';

/**
 * Routing service. Uses the public OSRM demo server for geometry, distance,
 * duration and turn-by-turn steps (keyless, supports car/bike/foot), and the
 * Open-Meteo elevation API to reconstruct an elevation profile OSRM does not
 * provide. Every external call is cached; failures throw a typed error so the
 * controller can respond honestly instead of inventing a straight line.
 *
 * Provider note: OpenRouteService would return elevation and OSM surface/
 * steepness natively, but requires an API key. This keyless OSRM + Open-Meteo
 * pairing is fully functional and verifiable without credentials; the provider
 * label is surfaced to the client for attribution.
 */
const OSRM_BASE = 'https://router.project-osrm.org';
const OPEN_METEO = 'https://api.open-meteo.com/v1/elevation';
export const PROVIDER = 'OSRM + Open-Meteo';

const OSRM_PROFILE = {
  'driving-car': 'driving',
  'cycling-regular': 'cycling',
  'foot-walking': 'walking',
};

export class RouteError extends Error {
  constructor(code, message) {
    super(message ?? code);
    this.code = code; // 'bad_profile' | 'no_route' | 'provider_unreachable'
  }
}

async function fetchJson(url, opts = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    return { ok: res.ok, status: res.status, json: await res.json().catch(() => null) };
  } finally {
    clearTimeout(timer);
  }
}

/** Haversine distance in metres. */
function haversine(a, b) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Evenly sample up to `max` points from a [lng,lat] coordinate list. */
function sampleCoords(coords, max) {
  if (coords.length <= max) return coords.map((c, i) => ({ i, lng: c[0], lat: c[1] }));
  const step = (coords.length - 1) / (max - 1);
  const out = [];
  for (let k = 0; k < max; k++) {
    const i = Math.round(k * step);
    out.push({ i, lng: coords[i][0], lat: coords[i][1] });
  }
  return out;
}

/** Fetch elevations (metres) for sample points via Open-Meteo (batched). */
async function fetchElevations(points) {
  const out = [];
  for (let i = 0; i < points.length; i += 100) {
    const batch = points.slice(i, i + 100);
    const lat = batch.map((p) => roundCoord(p.lat)).join(',');
    const lng = batch.map((p) => roundCoord(p.lng)).join(',');
    const key = `elev:${lat}|${lng}`;
    let elevations = cacheGet(key);
    if (!elevations) {
      const { ok, json } = await fetchJson(`${OPEN_METEO}?latitude=${lat}&longitude=${lng}`);
      if (!ok || !Array.isArray(json?.elevation)) return null; // elevation unavailable
      elevations = json.elevation;
      cacheSet(key, elevations, TTL.elevation);
    }
    out.push(...elevations);
  }
  return out;
}

/**
 * Build the elevation profile and derived terrain figures from sampled points
 * and their elevations. Cumulative distance is measured along the sampled path.
 */
function buildElevationProfile(sampled, elevations) {
  const profile = [];
  let cumM = 0;
  let ascent = 0;
  let descent = 0;
  let max = -Infinity;
  let min = Infinity;
  for (let k = 0; k < sampled.length; k++) {
    const ele = elevations[k];
    if (k > 0) {
      cumM += haversine(sampled[k - 1], sampled[k]);
      const d = ele - elevations[k - 1];
      if (d > 0) ascent += d;
      else descent += -d;
    }
    max = Math.max(max, ele);
    min = Math.min(min, ele);
    profile.push({ distKm: Math.round(cumM) / 1000, ele: Math.round(ele), lat: sampled[k].lat, lng: sampled[k].lng });
  }

  // Steepest *sustained* gradient: the run of ≥1.5 km with the highest average
  // absolute gradient (avoids flagging single noisy points).
  let steepest = { lengthKm: 0, gradientPct: 0, startKm: 0 };
  for (let a = 0; a < profile.length; a++) {
    for (let b = a + 1; b < profile.length; b++) {
      const run = profile[b].distKm - profile[a].distKm;
      if (run < 1.5) continue;
      const rise = profile[b].ele - profile[a].ele;
      const grad = Math.abs(rise) / (run * 1000) * 100;
      if (run <= 12 && grad > steepest.gradientPct) {
        steepest = { lengthKm: Math.round(run * 10) / 10, gradientPct: Math.round(grad * 10) / 10, startKm: profile[a].distKm };
      }
    }
  }

  return {
    profile,
    ascent: Math.round(ascent),
    descent: Math.round(descent),
    maxAltitude: Math.round(max),
    minAltitude: Math.round(min),
    steepest,
  };
}

/**
 * Plan a route from `start` to `end` for a travel `profile`.
 * @returns normalized route with geometry, distance(m), duration(s), steps,
 *   elevation profile (or null), terrain summary and the provider label.
 */
export async function planRoute({ start, end, profile }) {
  const osrmProfile = OSRM_PROFILE[profile];
  if (!osrmProfile) throw new RouteError('bad_profile', `Unsupported profile: ${profile}`);

  const key = `route:${osrmProfile}:${roundCoord(start.lat)},${roundCoord(start.lng)}:${roundCoord(end.lat)},${roundCoord(end.lng)}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const coordsParam = `${start.lng},${start.lat};${end.lng},${end.lat}`;
  const url = `${OSRM_BASE}/route/v1/${osrmProfile}/${coordsParam}?overview=full&geometries=geojson&steps=true`;

  let result;
  try {
    result = await fetchJson(url);
  } catch {
    throw new RouteError('provider_unreachable', 'The routing provider could not be reached.');
  }
  if (!result.ok || result.json?.code !== 'Ok' || !result.json.routes?.length) {
    throw new RouteError('no_route', 'No route could be found between these points.');
  }

  const route = result.json.routes[0];
  const coords = route.geometry.coordinates; // [lng, lat]
  const steps = (route.legs ?? []).flatMap((leg) =>
    (leg.steps ?? []).map((s) => ({
      type: s.maneuver?.type ?? 'continue',
      modifier: s.maneuver?.modifier ?? null,
      name: s.name || '',
      distance: Math.round(s.distance),
      duration: Math.round(s.duration),
    }))
  );

  // Elevation profile (best-effort; null if the elevation provider fails).
  const sampled = sampleCoords(coords, 96);
  let elevation = null;
  const elevations = await fetchElevations(sampled);
  if (elevations && elevations.length === sampled.length) {
    elevation = buildElevationProfile(sampled, elevations);
  }

  const planned = {
    provider: PROVIDER,
    profile,
    geometry: coords, // [lng, lat] for GeoJSON/Leaflet
    distance: Math.round(route.distance),
    duration: Math.round(route.duration),
    steps,
    elevation,
  };
  return cacheSet(key, planned, TTL.route);
}
