/**
 * Helpers that enforce the platform's consistent JSON envelope.
 * Every successful response is `{ success: true, data, meta? }`; every
 * error is `{ success: false, message, errors? }` (see errorHandler).
 */

/**
 * Send a success response.
 *
 * @param {import('express').Response} res
 * @param {*} data  the payload
 * @param {object} [meta]  optional metadata (e.g. pagination info)
 * @param {number} [statusCode=200]
 */
export function sendSuccess(res, data, meta, statusCode = 200) {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

/**
 * Build a pagination meta object from the common query parameters.
 *
 * @param {number} total  total number of matching documents
 * @param {number} page   current page (1-based)
 * @param {number} limit  page size
 * @returns {{ total: number, page: number, limit: number, pages: number }}
 */
export function buildPaginationMeta(total, page, limit) {
  return {
    total,
    page,
    limit,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
}
