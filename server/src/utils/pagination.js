/**
 * Parse and clamp the common `page` / `limit` pagination query parameters.
 * Shared by every list endpoint so pagination behaves identically everywhere.
 *
 * @param {object} query  the Express `req.query`
 * @param {object} [opts]
 * @param {number} [opts.defaultLimit=9]
 * @param {number} [opts.maxLimit=50]
 * @returns {{ page: number, limit: number, skip: number }}
 */
export function getPaginationParams(query, { defaultLimit = 9, maxLimit = 50 } = {}) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(limit) || limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  return { page, limit, skip: (page - 1) * limit };
}

/**
 * Build the pagination `meta` object returned alongside list results.
 *
 * @param {number} total  total matching documents
 * @param {number} page
 * @param {number} limit
 * @returns {{ total:number, page:number, limit:number, totalPages:number }}
 */
export function buildMeta(total, page, limit) {
  return {
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
