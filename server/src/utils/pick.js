/**
 * Return a new object containing only the allow-listed keys from `source`
 * whose value is not `undefined`. This is the safe alternative to spreading a
 * request body into a document write: it enumerates exactly what a client may
 * set, so fields like `role`, `isPublished`, `ratingAverage`, `userId` or
 * `villageId` can never be mass-assigned even if present in the body.
 *
 * @param {object} source  typically req.body
 * @param {string[]} allowed  the permitted field names
 * @returns {object}
 */
export function pick(source, allowed) {
  const out = {};
  if (!source) return out;
  for (const key of allowed) {
    if (source[key] !== undefined) out[key] = source[key];
  }
  return out;
}
