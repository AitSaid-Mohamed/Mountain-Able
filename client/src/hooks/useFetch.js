import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../lib/api.js';

/**
 * Fetch data from the API and expose `{ data, meta, loading, error, refetch }`.
 * Pages use this instead of calling axios inline, so every view gets the same
 * loading / error / success handling.
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
  const paramsKey = JSON.stringify(params ?? {});
  const activeRef = useRef(true);

  const run = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(path, { params });
      if (!activeRef.current) return;
      setData(res.data.data);
      setMeta(res.data.meta ?? null);
    } catch (err) {
      if (!activeRef.current) return;
      setError(err);
    } finally {
      if (activeRef.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, paramsKey]);

  useEffect(() => {
    activeRef.current = true;
    run();
    return () => {
      activeRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, ...deps]);

  return { data, meta, loading, error, refetch: run };
}
