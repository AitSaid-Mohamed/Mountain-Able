import { useState, useEffect, useCallback, useRef } from 'react';
import { cachedGet } from '../lib/requestCache.js';

/**
 * Fetch data from the API and expose `{ data, meta, loading, error, refetch }`.
 * Pages use this instead of calling axios inline, so every view gets the same
 * loading / error / success handling.
 *
 * Requests go through the shared request cache (`lib/requestCache.js`), which
 * de-duplicates concurrent identical GETs and briefly caches successes — so a
 * StrictMode remount or a navigate-away-and-back does not refetch. `refetch()`
 * always bypasses the cache.
 *
 * Callers may pass `params` inline: the hook serialises them to a stable
 * primitive key internally, so no caller needs to remember `useMemo`.
 *
 * @param {string|null} path  API path (relative to baseURL); pass null to skip
 * @param {object} [options]
 * @param {object} [options.params]  query params
 * @param {Array}  [options.deps]  extra dependencies that trigger a refetch
 */
export function useFetch(path, { params, deps = [] } = {}) {
  const [data, setData] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState(null);

  // Stable primitive key: the effect depends on this string, never on the
  // identity of the `params` object (which callers may recreate each render).
  const paramsKey = JSON.stringify(params ?? {});
  const activeRef = useRef(true);

  const load = useCallback(
    async (bypassCache) => {
      if (!path) return;
      setLoading(true);
      setError(null);
      try {
        const parsedParams = JSON.parse(paramsKey);
        const res = await cachedGet(path, { params: parsedParams, bypassCache });
        if (!activeRef.current) return;
        setData(res.data);
        setMeta(res.meta);
      } catch (err) {
        if (!activeRef.current) return;
        setError(err);
      } finally {
        if (activeRef.current) setLoading(false);
      }
    },
    [path, paramsKey]
  );

  useEffect(() => {
    activeRef.current = true;
    load(false);
    return () => {
      activeRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, ...deps]);

  // Public refetch always bypasses the cache (e.g. after a mutation).
  const refetch = useCallback(() => load(true), [load]);

  return { data, meta, loading, error, refetch };
}
