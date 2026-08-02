import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Aggregate the authenticated officer's scope: the villages of their own
 * municipality plus per-village attraction/event/review counts and the most
 * recent reviews. There is no per-officer stats endpoint, so this composes the
 * public resource endpoints (the API still enforces municipality ownership on
 * writes). Officers manage only a handful of villages, so the fan-out is small.
 */
export function useOfficerScope() {
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true, error: null, villages: [], feedback: [], totals: null });

  const load = useCallback(async () => {
    if (user.role !== 'officer') {
      setState({ loading: false, error: null, villages: [], feedback: [], totals: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const myMuni = user.municipalityId?._id ?? user.municipalityId;
      const res = await api.get('/villages', { params: { includeUnpublished: 'true', limit: 50 } });
      const mine = res.data.data.filter(
        (v) => (v.municipalityId?._id ?? v.municipalityId) === myMuni
      );

      const perVillage = await Promise.all(
        mine.map(async (v) => {
          const [att, evs, cmts] = await Promise.all([
            api.get(`/villages/${v._id}/attractions`),
            api.get(`/villages/${v._id}/events`, { params: { upcoming: 'true' } }),
            api.get(`/villages/${v._id}/comments`, { params: { limit: 5 } }),
          ]);
          return {
            village: v,
            attractions: att.data.data.length,
            events: evs.data.data.length,
            reviews: cmts.data.meta?.total ?? cmts.data.data.length,
            recent: cmts.data.data.map((c) => ({ ...c, villageName: v.name, villageSlug: v.slug })),
          };
        })
      );

      const totals = {
        villages: mine.length,
        attractions: perVillage.reduce((n, x) => n + x.attractions, 0),
        events: perVillage.reduce((n, x) => n + x.events, 0),
        reviews: mine.reduce((n, v) => n + (v.ratingCount ?? 0), 0),
      };
      const feedback = perVillage
        .flatMap((x) => x.recent)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const villages = mine.map((v) => {
        const pv = perVillage.find((x) => x.village._id === v._id);
        return { ...v, attractionsCount: pv?.attractions ?? 0, eventsCount: pv?.events ?? 0 };
      });

      setState({ loading: false, error: null, villages, feedback, totals });
    } catch (error) {
      setState((s) => ({ ...s, loading: false, error }));
    }
  }, [user.municipalityId]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refetch: load };
}
