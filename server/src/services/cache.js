/**
 * Tiny in-process TTL cache for third-party responses (routing, elevation,
 * Overpass). Mountain routes between fixed points rarely change, so caching by
 * rounded coordinates with a long TTL respects provider rate limits and makes
 * repeat views instant. This is intentionally in-memory: it is a best-effort
 * accelerator, not a source of truth, and an empty cache after a restart simply
 * means the next request repopulates it.
 */
const store = new Map();

/** Get a cached value, or undefined if missing/expired. */
export function cacheGet(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (entry.expiry < Date.now()) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

/** Set a cached value with a TTL in milliseconds. */
export function cacheSet(key, value, ttlMs) {
  store.set(key, { value, expiry: Date.now() + ttlMs });
  // Opportunistic cleanup so the map can't grow without bound.
  if (store.size > 500) {
    const now = Date.now();
    for (const [k, v] of store) if (v.expiry < now) store.delete(k);
  }
  return value;
}

/** Common TTLs. */
export const TTL = {
  route: 7 * 24 * 60 * 60 * 1000, // routes change rarely — 7 days
  elevation: 30 * 24 * 60 * 60 * 1000, // terrain is static — 30 days
  overpass: 24 * 60 * 60 * 1000, // POIs change slowly — 1 day
  geocode: 7 * 24 * 60 * 60 * 1000,
};

/** Round a coordinate for stable cache keys (~11 m at 4 decimals). */
export const roundCoord = (n) => Math.round(n * 1e4) / 1e4;
