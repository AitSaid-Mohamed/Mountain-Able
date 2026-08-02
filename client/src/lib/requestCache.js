import api from './api.js';

/**
 * Request de-duplication + short-lived GET cache.
 *
 * Two problems this solves:
 *  1. React StrictMode double-invokes effects in development, and navigating
 *     away and back remounts components — both cause `useFetch` to fire the
 *     same GET twice. A brief cache absorbs those.
 *  2. Independent components sometimes request the same URL at the same moment
 *     (e.g. several `/my` screens reading `/comments/me`). An in-flight map
 *     means the second caller shares the first caller's promise instead of
 *     opening a second connection.
 *
 * The cache is deliberately short (a few seconds): it is a de-duplication
 * accelerator, not a data store. Mutations bypass it and callers invalidate
 * explicitly; `refetch()` always bypasses.
 */
const TTL_MS = 5000;
const inFlight = new Map(); // key -> Promise<{ data, meta }>
const cache = new Map(); // key -> { value: { data, meta }, expiry }

/** Stable cache key from path + params (key order-independent). */
function keyFor(path, params) {
  if (!params || Object.keys(params).length === 0) return path;
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return `${path}?${sorted}`;
}

/**
 * GET with de-duplication and caching.
 * @param {string} path
 * @param {object} [opts]
 * @param {object} [opts.params]
 * @param {boolean} [opts.bypassCache] skip the cache (still de-dupes in-flight)
 * @returns {Promise<{ data, meta }>}
 */
export function cachedGet(path, { params, bypassCache = false } = {}) {
  const key = keyFor(path, params);

  if (!bypassCache) {
    const hit = cache.get(key);
    if (hit && hit.expiry > Date.now()) return Promise.resolve(hit.value);
    const pending = inFlight.get(key);
    if (pending) return pending;
  }

  const promise = api
    .get(path, { params })
    .then((res) => {
      const value = { data: res.data.data, meta: res.data.meta ?? null };
      cache.set(key, { value, expiry: Date.now() + TTL_MS });
      inFlight.delete(key);
      return value;
    })
    .catch((err) => {
      inFlight.delete(key);
      throw err;
    });

  inFlight.set(key, promise);
  return promise;
}

/**
 * Invalidate cached entries whose key starts with `prefix` (path without
 * query). Call after a mutation so the next read is fresh. With no argument,
 * clears everything.
 */
export function invalidate(prefix) {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key === prefix || key.startsWith(`${prefix}?`) || key.startsWith(`${prefix}/`)) {
      cache.delete(key);
    }
  }
}
