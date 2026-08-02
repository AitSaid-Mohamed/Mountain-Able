import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter: 100 requests per 15 minutes per IP.
 * Applied to the whole `/api` surface.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

/**
 * Stricter limiter for authentication endpoints to slow down brute-force
 * attempts: 20 requests per 15 minutes per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
});

/**
 * Tighter limiter for the routing endpoints, since each request may hit
 * third-party services (OSRM, Open-Meteo, Overpass, Nominatim): 60 requests
 * per 15 minutes per IP. Caching absorbs most repeat traffic beneath this.
 *
 * 60 rather than a tighter number because planning a single journey already
 * costs three requests (geocode, plan, corridor), and changing travel profile
 * or retrying a failed route costs more — a tighter cap throttles one genuine
 * user. Still well under what would let a client hammer a provider through us,
 * since only cache misses reach a third party at all.
 */
export const routesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many route requests, please try again shortly.' },
});
