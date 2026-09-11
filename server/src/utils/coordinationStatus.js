import CoordinationRequest from '../models/CoordinationRequest.js';

/**
 * Lazy expiry for coordination requests.
 *
 * The platform has no scheduled job runner, and adding one so a status field can
 * flip on a timer would be disproportionate. Instead a request whose `expiresAt`
 * has passed is treated as `expired` from the moment anyone looks at it, and the
 * stored status is corrected on the next read that touches it.
 *
 * The cost of that choice, stated plainly: between expiry and the next read, the
 * database still says `open`. **Anything that counts requests by status must
 * therefore apply the same cutoff at query time**, or it will overcount `open` —
 * see `EXPIRED_AWARE_STATUS` for the aggregation-pipeline form used by the
 * statistics endpoints.
 */

/** Mongo filter matching requests that are stored `open` but have lapsed. */
export const lapsedFilter = (now = new Date()) => ({
  status: 'open',
  expiresAt: { $lte: now },
});

/**
 * Flip any lapsed request to `expired`. Called at the start of the list/detail
 * read paths, so the data is correct whenever it is observed.
 *
 * @returns {Promise<number>} how many were updated
 */
export async function sweepExpired(now = new Date()) {
  const res = await CoordinationRequest.updateMany(lapsedFilter(now), {
    $set: { status: 'expired', closedAt: now },
  });
  return res.modifiedCount ?? 0;
}

/**
 * An aggregation `$expr`-safe expression that yields the *effective* status of a
 * request, applying the expiry cutoff without needing a prior sweep. Use this in
 * statistics pipelines so a figure is never wrong merely because nobody has read
 * the request since it lapsed.
 *
 * @param {Date} now
 * @returns {object} a `$switch` expression resolving to the effective status
 */
export const EXPIRED_AWARE_STATUS = (now = new Date()) => ({
  $cond: [
    { $and: [{ $eq: ['$status', 'open'] }, { $lte: ['$expiresAt', now] }] },
    'expired',
    '$status',
  ],
});

/**
 * Default expiry for a new request: the day after the need ends, or 30 days out
 * when no end date was given. A request with no horizon would otherwise sit open
 * forever, which is the state that makes a coordination board look dead.
 */
export function defaultExpiry({ neededTo }, now = new Date()) {
  if (neededTo) {
    const d = new Date(neededTo);
    d.setDate(d.getDate() + 1);
    if (d > now) return d;
  }
  const d = new Date(now);
  d.setDate(d.getDate() + 30);
  return d;
}
