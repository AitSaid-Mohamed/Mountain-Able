/**
 * Wrap an async Express handler so any rejected promise is forwarded to
 * `next()` (and therefore to the centralised error handler). This removes
 * the need for a try/catch block in every controller.
 *
 * @param {Function} fn  async (req, res, next) => {...}
 * @returns {Function} an Express handler with error forwarding
 */
export default function catchAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
