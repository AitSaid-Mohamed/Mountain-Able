import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../lib/api.js';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './ToastContext.jsx';

const MeContext = createContext(null);
const vid = (rec) => rec.villageId?._id ?? rec.villageId;
const byVisitDesc = (a, b) => new Date(b.visitedAt) - new Date(a.visitedAt);

/**
 * Holds the authenticated tourist's self-declared favourites and visits as the
 * single source of truth, so the public detail page and the /my dashboard stay
 * in sync. Mutations are optimistic with rollback on error. Inert for
 * non-tourists (and logged-out users).
 */
export function MeProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const isTourist = user?.role === 'tourist';
  const [favorites, setFavorites] = useState([]);
  const [visited, setVisited] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!isTourist) {
      setFavorites([]); setVisited([]); setLoading(false); setError(null);
      return;
    }
    setLoading(true); setError(null);
    try {
      const [f, v] = await Promise.all([api.get('/me/favorites'), api.get('/me/visited')]);
      setFavorites(f.data.data);
      setVisited(v.data.data);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [isTourist]);

  useEffect(() => { load(); }, [load]);

  const favoriteFor = useCallback((id) => favorites.find((f) => vid(f) === id) ?? null, [favorites]);
  const visitedFor = useCallback((id) => visited.find((v) => vid(v) === id) ?? null, [visited]);

  const addFavorite = useCallback(async (village) => {
    const temp = { _id: `temp-${village._id}`, villageId: village };
    setFavorites((prev) => [temp, ...prev]);
    try {
      const r = await api.post('/me/favorites', { villageId: village._id });
      setFavorites((prev) => prev.map((f) => (f._id === temp._id ? r.data.data : f)));
    } catch (e) {
      setFavorites((prev) => prev.filter((f) => f._id !== temp._id));
      toast.error(e.response?.data?.message ?? 'Could not save favourite.');
    }
  }, [toast]);

  const removeFavorite = useCallback(async (recordId) => {
    let snapshot;
    setFavorites((prev) => { snapshot = prev; return prev.filter((f) => f._id !== recordId); });
    try {
      await api.delete(`/me/favorites/${recordId}`);
    } catch (e) {
      setFavorites(snapshot);
      toast.error(e.response?.data?.message ?? 'Could not remove favourite.');
    }
  }, [toast]);

  const toggleFavorite = useCallback((village) => {
    const rec = favoriteFor(village._id);
    return rec ? removeFavorite(rec._id) : addFavorite(village);
  }, [favoriteFor, addFavorite, removeFavorite]);

  const addVisited = useCallback(async (village, { visitedAt, note } = {}) => {
    const temp = { _id: `temp-${village._id}`, villageId: village, visitedAt: visitedAt || new Date().toISOString(), note };
    setVisited((prev) => [temp, ...prev].sort(byVisitDesc));
    try {
      const r = await api.post('/me/visited', { villageId: village._id, visitedAt, note });
      setVisited((prev) => prev.map((v) => (v._id === temp._id ? r.data.data : v)).sort(byVisitDesc));
    } catch (e) {
      setVisited((prev) => prev.filter((v) => v._id !== temp._id));
      toast.error(e.response?.data?.message ?? 'Could not save visit.');
      throw e;
    }
  }, [toast]);

  const updateVisited = useCallback(async (recordId, patch) => {
    let snapshot;
    setVisited((prev) => { snapshot = prev; return prev.map((v) => (v._id === recordId ? { ...v, ...patch } : v)).sort(byVisitDesc); });
    try {
      const r = await api.patch(`/me/visited/${recordId}`, patch);
      setVisited((prev) => prev.map((v) => (v._id === recordId ? r.data.data : v)).sort(byVisitDesc));
    } catch (e) {
      setVisited(snapshot);
      toast.error(e.response?.data?.message ?? 'Could not update visit.');
    }
  }, [toast]);

  const removeVisited = useCallback(async (recordId) => {
    let snapshot;
    setVisited((prev) => { snapshot = prev; return prev.filter((v) => v._id !== recordId); });
    try {
      await api.delete(`/me/visited/${recordId}`);
    } catch (e) {
      setVisited(snapshot);
      toast.error(e.response?.data?.message ?? 'Could not remove visit.');
    }
  }, [toast]);

  const value = useMemo(
    () => ({
      isTourist, favorites, visited, loading, error, reload: load,
      favoriteFor, visitedFor, toggleFavorite, addVisited, updateVisited, removeVisited,
    }),
    [isTourist, favorites, visited, loading, error, load, favoriteFor, visitedFor, toggleFavorite, addVisited, updateVisited, removeVisited]
  );

  return <MeContext.Provider value={value}>{children}</MeContext.Provider>;
}

export function useMe() {
  const ctx = useContext(MeContext);
  if (!ctx) throw new Error('useMe must be used within a MeProvider');
  return ctx;
}
