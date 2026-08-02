import { createHash } from 'node:crypto';
import { cacheGet, cacheSet, TTL, roundCoord } from './cache.js';

/**
 * OpenStreetMap data services: corridor POIs and road-surface probing via the
 * Overpass API, and place geocoding via Nominatim. Overpass is a shared
 * community resource that is frequently slow or rate-limited, so we: simplify
 * the query geometry, try several mirrors in turn, cache by query hash, and —
 * crucially — degrade honestly (returning `unavailable: true`) rather than
 * throwing, because sparse or missing coverage is normal in mountain areas.
 *
 * All data returned here must be attributed to OpenStreetMap (ODbL).
 */
export const OSM_ATTRIBUTION = '© OpenStreetMap contributors';

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];
const OVERPASS_TIMEOUT_MS = 20000;
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const UA = 'MountainAble/1.0 (Politecnico di Milano student project)';

/** POI category definitions — drive both the Overpass query and classification. */
export const POI_DEFS = [
  { group: 'essential', sub: 'fuel', k: 'amenity', v: 'fuel' },
  { group: 'essential', sub: 'charging', k: 'amenity', v: 'charging_station' },
  { group: 'essential', sub: 'pharmacy', k: 'amenity', v: 'pharmacy' },
  { group: 'essential', sub: 'hospital', k: 'amenity', v: 'hospital' },
  { group: 'essential', sub: 'atm', k: 'amenity', v: 'atm' },
  { group: 'supplies', sub: 'supermarket', k: 'shop', v: 'supermarket' },
  { group: 'supplies', sub: 'bakery', k: 'shop', v: 'bakery' },
  { group: 'supplies', sub: 'convenience', k: 'shop', v: 'convenience' },
  { group: 'rest', sub: 'parking', k: 'amenity', v: 'parking' },
  { group: 'rest', sub: 'picnic', k: 'tourism', v: 'picnic_site' },
  { group: 'rest', sub: 'water', k: 'amenity', v: 'drinking_water' },
  { group: 'rest', sub: 'toilets', k: 'amenity', v: 'toilets' },
  { group: 'rest', sub: 'viewpoint', k: 'tourism', v: 'viewpoint' },
  { group: 'interest', sub: 'historic', k: 'historic', v: null },
  { group: 'interest', sub: 'church', k: 'amenity', v: 'place_of_worship' },
  { group: 'interest', sub: 'museum', k: 'tourism', v: 'museum' },
];
const UNPAVED = new Set(['unpaved', 'gravel', 'fine_gravel', 'ground', 'dirt', 'earth', 'compacted', 'sand', 'grass', 'mud', 'pebblestone']);

const haversineKm = (a, b) => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180, la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

/** Evenly sample up to `max` {lat,lng} points from a [lng,lat] geometry. */
function sample(geometry, max) {
  const pts = geometry.map((c) => ({ lat: c[1], lng: c[0] }));
  if (pts.length <= max) return pts;
  const step = (pts.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, k) => pts[Math.round(k * step)]);
}

function classify(tags = {}) {
  for (const d of POI_DEFS) {
    if (d.v === null ? tags[d.k] != null : tags[d.k] === d.v) return { group: d.group, sub: d.sub };
  }
  return null;
}

async function overpassRun(query) {
  const key = `overpass:${createHash('sha1').update(query).digest('hex')}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  for (const ep of OVERPASS_ENDPOINTS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), OVERPASS_TIMEOUT_MS);
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json', 'User-Agent': UA },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok || !(res.headers.get('content-type') || '').includes('json')) continue;
      const json = await res.json();
      cacheSet(key, json.elements ?? [], TTL.overpass);
      return json.elements ?? [];
    } catch {
      clearTimeout(timer);
      // try the next mirror
    }
  }
  return null; // all mirrors failed — caller degrades gracefully
}

const CORRIDOR_KM = 2; // POIs within ~2 km of the route polyline

/** Bounding box [S,W,N,E] of a [lng,lat] geometry, padded in degrees. */
function bbox(geometry, pad = 0.02) {
  let s = 90, w = 180, n = -90, e = -180;
  for (const [lng, lat] of geometry) {
    s = Math.min(s, lat); n = Math.max(n, lat);
    w = Math.min(w, lng); e = Math.max(e, lng);
  }
  return [s - pad, w - pad, n + pad, e + pad].map(roundCoord).join(',');
}

/**
 * Fetch OSM POIs (and best-effort road-surface data) near the route.
 *
 * POIs use a single cheap bounding-box query — multi-point `around` queries
 * reliably time out Overpass on long mountain routes — then are filtered to
 * within ~2 km of the simplified polyline in JS. Surface is a separate,
 * best-effort probe that degrades to "not available" honestly.
 *
 * @returns {{ pois, surface, unavailable, attribution }}
 */
export async function corridorData(geometry, types) {
  const wanted = types && types.length ? POI_DEFS.filter((d) => types.includes(d.sub)) : POI_DEFS;
  const filterPts = sample(geometry, 80); // dense sampling for accurate 2 km filtering
  const box = bbox(geometry);

  const poiLines = wanted
    .map((d) => `nwr${d.v === null ? `["${d.k}"]` : `["${d.k}"="${d.v}"]`}(${box});`)
    .join('');
  const query = `[out:json][timeout:90];(${poiLines});out center 500;`;

  const [elements, surface] = await Promise.all([overpassRun(query), probeSurface(geometry)]);

  if (elements === null) {
    return { pois: [], surface, unavailable: true, attribution: OSM_ATTRIBUTION };
  }

  const pois = [];
  const seen = new Set();
  for (const el of elements) {
    const tags = el.tags ?? {};
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (lat == null || lng == null) continue;
    const cls = classify(tags);
    if (!cls) continue;

    const distanceKm = Math.min(...filterPts.map((p) => haversineKm(p, { lat, lng })));
    if (distanceKm > CORRIDOR_KM) continue; // keep only the corridor
    const id = `${el.type}/${el.id}`;
    if (seen.has(id)) continue;
    seen.add(id);
    pois.push({ id, group: cls.group, sub: cls.sub, name: tags.name || null, lat, lng, distanceKm: Math.round(distanceKm * 10) / 10 });
  }

  pois.sort((a, b) => a.distanceKm - b.distanceKm);
  return { pois, surface, unavailable: false, attribution: OSM_ATTRIBUTION };
}

/**
 * Best-effort probe of road surface/width tags hugging the route. Uses a small
 * `around` query over a few sample points; if Overpass does not answer, returns
 * `{ available: false }` so the advisory can state the gap honestly rather than
 * assume the road is paved.
 */
async function probeSurface(geometry) {
  const pts = sample(geometry, 12);
  const around = pts.map((p) => `${roundCoord(p.lat)},${roundCoord(p.lng)}`).join(',');
  const query = `[out:json][timeout:90];(way["highway"]["surface"](around:25,${around});way["highway"]["tracktype"](around:25,${around});way["highway"]["width"](around:25,${around}););out tags 200;`;
  const ways = await overpassRun(query);
  if (ways === null) return { available: false };

  const surfaces = new Set();
  let unpaved = false;
  let narrow = false;
  for (const w of ways) {
    const tags = w.tags ?? {};
    if (tags.surface) {
      surfaces.add(tags.surface);
      if (UNPAVED.has(tags.surface)) unpaved = true;
    }
    if (tags.tracktype && tags.tracktype !== 'grade1') unpaved = true;
    const width = parseFloat(tags.width);
    if (Number.isFinite(width) && width < 3.5) narrow = true;
  }
  return { available: ways.length > 0, surfaces: [...surfaces], unpaved, narrow, waysRecorded: ways.length };
}

/** Geocode a free-text place query via Nominatim. */
export async function geocode(q) {
  const query = q.trim();
  if (!query) return [];
  const key = `geocode:${query.toLowerCase()}`;
  const cached = cacheGet(key);
  if (cached) return cached;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${NOMINATIM}?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=0`, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return [];
    const json = await res.json();
    const results = json.map((r) => ({ label: r.display_name, lat: Number(r.lat), lng: Number(r.lon) }));
    return cacheSet(key, results, TTL.geocode);
  } catch {
    clearTimeout(timer);
    return [];
  }
}
