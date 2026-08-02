import Village from '../models/Village.js';
import Attraction from '../models/Attraction.js';
import Event from '../models/Event.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { planRoute, RouteError, PROVIDER } from '../services/routing.js';
import { corridorData, geocode as osmGeocode, OSM_ATTRIBUTION } from '../services/osm.js';
import { buildTerrainAdvisories, buildSurfaceAdvisories } from '../services/advisories.js';

const CORRIDOR_KM = 8; // platform villages within 8 km of the route
const MAX_CORRIDOR_POINTS = 300; // cap on user-supplied geometry (DoS guard)

/** True when lat/lng are finite numbers within valid WGS84 bounds. */
const validCoord = (lat, lng) =>
  Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

const haversineKm = (a, b) => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180, la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

/** Evenly sample up to `max` {lat,lng} points from a [lng,lat] geometry. */
function sampleLatLng(geometry, max) {
  const pts = geometry.map((c) => ({ lat: c[1], lng: c[0] }));
  if (pts.length <= max) return pts;
  const step = (pts.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, k) => pts[Math.round(k * step)]);
}

/**
 * Platform data (our MongoDB) within the route corridor, via a geospatial
 * query — a single index-backed `$or` of `$centerSphere` circles chained along
 * the simplified route, not a JavaScript scan of every village.
 */
async function platformAlongRoute(geometry, excludeVillageId, date) {
  const pts = sampleLatLng(geometry, 24);
  const radiusRad = CORRIDOR_KM / 6371;
  const villages = await Village.find({
    isPublished: true,
    _id: { $ne: excludeVillageId },
    $or: pts.map((p) => ({ geo: { $geoWithin: { $centerSphere: [[p.lng, p.lat], radiusRad] } } })),
  }).select('name slug region province coverImage ratingAverage ratingCount location');

  const villagesAlong = villages
    .map((v) => ({
      _id: v._id, name: v.name, slug: v.slug, region: v.region, province: v.province,
      coverImage: v.coverImage, ratingAverage: v.ratingAverage, ratingCount: v.ratingCount,
      location: v.location,
      distanceKm: Math.round(Math.min(...pts.map((p) => haversineKm(p, v.location))) * 10) / 10,
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const alongIds = villagesAlong.map((v) => v._id);

  // Attractions of the corridor villages, grouped by category.
  const attractions = alongIds.length
    ? await Attraction.find({ villageId: { $in: alongIds } }).populate('categoryId', 'name slug icon')
    : [];
  const attractionsByCategory = {};
  for (const a of attractions) {
    const cat = a.categoryId?.name ?? '—';
    (attractionsByCategory[cat] ??= { icon: a.categoryId?.icon, items: [] }).items.push({ _id: a._id, name: a.name });
  }

  // Events near the route in the days around the travel date (if supplied).
  let eventsAlong = [];
  if (date) {
    const d = new Date(date);
    if (!Number.isNaN(d.getTime())) {
      const from = new Date(d); from.setDate(from.getDate() - 3);
      const to = new Date(d); to.setDate(to.getDate() + 3);
      const ids = [...alongIds, excludeVillageId].filter(Boolean);
      const events = await Event.find({
        villageId: { $in: ids },
        startDate: { $lte: to },
        endDate: { $gte: from },
      }).populate('villageId', 'name slug').sort('startDate');
      eventsAlong = events.map((e) => ({
        _id: e._id, title: e.title, startDate: e.startDate, endDate: e.endDate,
        village: e.villageId ? { name: e.villageId.name, slug: e.villageId.slug } : null,
      }));
    }
  }

  return { villagesAlong, attractionsByCategory, eventsAlong };
}

/**
 * POST /api/routes/plan
 * Body: { start:{lat,lng}, villageId, profile, date? }
 * Returns the computed route, terrain summary, derived advisories and the
 * platform data along the corridor. On a routing failure it still returns the
 * destination village so the client can show its location.
 */
export const plan = catchAsync(async (req, res, next) => {
  const { start, villageId, profile = 'driving-car', date } = req.body;
  // Validate coordinates as in-bounds numbers before they reach any outbound
  // URL — the coordinates are the only user input that touches the provider.
  if (!start || !validCoord(start.lat, start.lng)) {
    return next(new AppError('A valid start location is required.', 422, { start: 'Required.' }));
  }
  const ALLOWED_PROFILES = ['driving-car', 'cycling-regular', 'foot-walking'];
  if (!ALLOWED_PROFILES.includes(profile)) {
    return next(new AppError('Invalid travel profile.', 422, { profile: 'Invalid.' }));
  }
  const village = await Village.findById(villageId).select('name slug region province location coverImage municipalityId').populate('municipalityId', 'name');
  if (!village) return next(new AppError('Village not found.', 404));

  const destination = {
    _id: village._id, name: village.name, slug: village.slug, region: village.region,
    province: village.province, location: village.location, coverImage: village.coverImage,
    municipality: village.municipalityId?.name ?? null,
  };

  let route;
  try {
    route = await planRoute({ start, end: village.location, profile });
  } catch (err) {
    if (err instanceof RouteError) {
      // Honest failure: no fake straight line — return the destination only.
      return sendSuccess(res, {
        destination, route: null, routeError: err.code, provider: PROVIDER, attribution: OSM_ATTRIBUTION,
      });
    }
    throw err;
  }

  const advisories = buildTerrainAdvisories(route.elevation, route.duration);
  const platform = await platformAlongRoute(route.geometry, village._id, date);

  sendSuccess(res, {
    destination,
    route: {
      provider: route.provider,
      profile: route.profile,
      geometry: route.geometry,
      distance: route.distance,
      duration: route.duration,
      steps: route.steps,
      elevation: route.elevation,
    },
    summary: route.elevation
      ? { ascent: route.elevation.ascent, descent: route.elevation.descent, maxAltitude: route.elevation.maxAltitude, steepest: route.elevation.steepest }
      : null,
    advisories,
    platform,
    attribution: OSM_ATTRIBUTION,
  });
});

/**
 * GET /api/routes/corridor?geometry=lng,lat;lng,lat&types=fuel,supermarket
 * OSM POIs within ~2 km of the route, plus surface-derived advisories. Degrades
 * honestly to `unavailable: true` when Overpass cannot be reached.
 */
export const corridor = catchAsync(async (req, res, next) => {
  const raw = req.query.geometry;
  if (!raw || typeof raw !== 'string') {
    return next(new AppError('A route geometry is required.', 422, { geometry: 'Required.' }));
  }
  // Cap the polyline: an unbounded query string is a DoS vector against us and
  // against Overpass. Reject rather than silently truncate.
  const pairs = raw.split(';');
  if (pairs.length > MAX_CORRIDOR_POINTS) {
    return next(new AppError(`Route geometry is too long (max ${MAX_CORRIDOR_POINTS} points).`, 422));
  }
  const geometry = pairs
    .map((pair) => pair.split(',').map(Number))
    .filter((c) => c.length === 2 && validCoord(c[1], c[0])); // [lng, lat]
  if (geometry.length < 2) return next(new AppError('Invalid route geometry.', 422));

  const types = req.query.types ? req.query.types.split(',').map((s) => s.trim()).filter(Boolean) : null;
  const data = await corridorData(geometry, types);
  const surfaceAdvisories = buildSurfaceAdvisories(data.surface);

  sendSuccess(res, {
    pois: data.pois,
    surface: data.surface,
    surfaceAdvisories,
    unavailable: data.unavailable,
    attribution: data.attribution,
  });
});

/** GET /api/routes/geocode?q=... — place search for the start point. */
export const geocode = catchAsync(async (req, res) => {
  const results = await osmGeocode(req.query.q ?? '');
  sendSuccess(res, results);
});
