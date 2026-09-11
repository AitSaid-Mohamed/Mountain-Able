import Village from '../models/Village.js';

/**
 * Geographic anchor for a municipality, derived as the centroid of its published
 * villages.
 *
 * `Municipality` carries no coordinates of its own — only `Village` has
 * `location`/`geo` — and coordination is inherently geographic, so an anchor has
 * to come from somewhere. Deriving it avoids a hand-entered second copy of data
 * the database already holds, and keeps the anchor correct as villages are added.
 *
 * **Known limitation, stated rather than buried.** A centroid is not where the
 * minibus is parked. For a comune spread along fifteen kilometres of valley the
 * anchor may sit a few kilometres from the village that actually holds the
 * service. At the granularity this feature operates at — *is this a forty-minute
 * neighbour or a four-hour one* — that error changes no decision. The correct fix
 * is to anchor each capability at a specific village (an optional `villageId` on
 * `MunicipalityCapability`), which was deferred as more work than the granularity
 * justifies. Documented in `docs/coordination-design.md` §2.5 and in the project
 * report's limitations section.
 *
 * A municipality with no published village has no anchor. Such municipalities are
 * returned with `anchor: null` and surfaced separately as "location unknown"
 * rather than silently dropped from a directory they belong in.
 *
 * @param {Array<import('mongoose').Types.ObjectId|string>} [municipalityIds]
 *   restrict to these ids; omit for all municipalities
 * @returns {Promise<Map<string, {lat:number,lng:number}>>} keyed by municipality id
 */
export async function municipalityAnchors(municipalityIds) {
  const match = { isPublished: true };
  if (municipalityIds?.length) match.municipalityId = { $in: municipalityIds };

  const rows = await Village.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$municipalityId',
        lat: { $avg: '$location.lat' },
        lng: { $avg: '$location.lng' },
        villageCount: { $sum: 1 },
      },
    },
  ]);

  const map = new Map();
  for (const r of rows) {
    if (Number.isFinite(r.lat) && Number.isFinite(r.lng)) {
      map.set(String(r._id), { lat: r.lat, lng: r.lng, villageCount: r.villageCount });
    }
  }
  return map;
}

/** Great-circle distance in kilometres. */
export function haversineKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
