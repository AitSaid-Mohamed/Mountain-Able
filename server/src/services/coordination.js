import Municipality from '../models/Municipality.js';
import MunicipalityCapability from '../models/MunicipalityCapability.js';
import { municipalityAnchors, haversineKm } from '../utils/municipalityAnchor.js';
import { travelMatrix } from './routing.js';

/**
 * A request routed to more than this many administrations is not coordination,
 * it is a mailshot. The cap is a product decision rather than a provider limit —
 * OSRM's table service would accept far more — and it is documented in `API.md`
 * so it is never a silent truncation.
 */
export const MAX_CANDIDATES = 25;

/** Radius used when the caller does not choose one. */
export const DEFAULT_RADIUS_KM = 60;

/**
 * Find the municipalities that could serve a request, ranked by real travel time.
 *
 * Three stages, one external call:
 *
 *  1. **Geospatial pre-filter.** Keep municipalities whose anchor lies within
 *     `radiusKm` straight-line. This is *lossless*: road distance is always at
 *     least straight-line distance, so anything outside the straight-line radius
 *     is necessarily outside the road radius too. Nothing valid is excluded.
 *  2. **Capability filter.** Keep those with an active declaration of the
 *     requested service. Asking a comune for something it never offered is noise.
 *  3. **One OSRM `/table` call** ranking the survivors by driving time.
 *
 * Ranking is by **duration, not distance**. Measured on this platform's own data,
 * two seeded municipalities 15 km apart in a straight line are 37 km and 75
 * minutes apart by road — distance alone misleads badly in mountain terrain, which
 * is the entire reason this feature routes rather than measuring radii.
 *
 * @param {object} opts
 * @param {string} opts.originMunicipalityId  the requesting municipality (excluded)
 * @param {string} [opts.serviceTypeId]  when given, only municipalities declaring it
 * @param {number} [opts.radiusKm]
 * @param {number} [opts.limit]
 * @returns {Promise<{ candidates: Array, rankedBy: 'road'|'straight-line', originAnchor: object|null }>}
 */
export async function findCandidates({
  originMunicipalityId,
  serviceTypeId,
  radiusKm = DEFAULT_RADIUS_KM,
  limit = MAX_CANDIDATES,
}) {
  const anchors = await municipalityAnchors();
  const originAnchor = anchors.get(String(originMunicipalityId)) ?? null;
  if (!originAnchor) return { candidates: [], rankedBy: 'road', originAnchor: null };

  // --- Stage 1: straight-line pre-filter (lossless, see above) --------------
  const withinRadius = [];
  for (const [id, anchor] of anchors) {
    if (id === String(originMunicipalityId)) continue;
    const straightKm = haversineKm(originAnchor, anchor);
    if (straightKm <= radiusKm) withinRadius.push({ id, anchor, straightKm });
  }
  if (!withinRadius.length) return { candidates: [], rankedBy: 'road', originAnchor };

  // --- Stage 2: capability filter ------------------------------------------
  let eligibleIds = withinRadius.map((c) => c.id);
  const capabilityByMunicipality = new Map();
  if (serviceTypeId) {
    const caps = await MunicipalityCapability.find({
      municipalityId: { $in: eligibleIds },
      serviceTypeId,
      isActive: true,
    }).lean();
    for (const c of caps) capabilityByMunicipality.set(String(c.municipalityId), c);
    eligibleIds = caps.map((c) => String(c.municipalityId));
  }
  let shortlist = withinRadius.filter((c) => eligibleIds.includes(c.id));
  if (!shortlist.length) return { candidates: [], rankedBy: 'road', originAnchor };

  // Cap by straight-line proximity before spending a provider call on them.
  shortlist.sort((a, b) => a.straightKm - b.straightKm);
  shortlist = shortlist.slice(0, limit);

  // --- Stage 3: one matrix call --------------------------------------------
  const matrix = await travelMatrix(
    originAnchor,
    shortlist.map((c) => c.anchor)
  );
  // A provider failure falls back to straight-line ordering and says so; it is
  // never presented as road ordering.
  const rankedBy = matrix ? 'road' : 'straight-line';

  const municipalities = await Municipality.find({ _id: { $in: shortlist.map((c) => c.id) } })
    .select('name region province contactEmail phone')
    .lean();
  const byId = new Map(municipalities.map((m) => [String(m._id), m]));

  const candidates = shortlist.map((c, i) => ({
    municipality: byId.get(c.id) ?? null,
    municipalityId: c.id,
    straightKm: Math.round(c.straightKm * 10) / 10,
    travelMinutes: matrix?.[i]?.travelMinutes ?? null,
    travelKm: matrix?.[i]?.travelKm ?? null,
    capability: capabilityByMunicipality.get(c.id) ?? null,
  }));

  candidates.sort((a, b) => {
    if (rankedBy === 'road' && a.travelMinutes != null && b.travelMinutes != null) {
      return a.travelMinutes - b.travelMinutes;
    }
    return a.straightKm - b.straightKm;
  });

  return { candidates, rankedBy, originAnchor };
}

/**
 * The nearest municipalities regardless of radius, used only to populate the
 * empty state when a radius matched nobody.
 *
 * The radius is never widened silently: an officer who believes they contacted
 * neighbours must not have quietly contacted a comune four hours away. This
 * returns suggestions for the officer to act on, with their real travel times, and
 * raising a request against one of them remains an explicit choice.
 */
export async function nearestMunicipalities({ originMunicipalityId, limit = 3 }) {
  const { candidates } = await findCandidates({
    originMunicipalityId,
    radiusKm: Number.POSITIVE_INFINITY,
    limit,
  });
  return candidates.slice(0, limit);
}
