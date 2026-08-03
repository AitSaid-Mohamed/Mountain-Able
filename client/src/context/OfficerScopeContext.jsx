import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { cachedGet } from '../lib/requestCache.js';
import { useAuth } from './AuthContext.jsx';

const OfficerScopeContext = createContext(null);

const EMPTY = {
  loading: false,
  error: null,
  villages: [],
  feedback: [],
  commentsByVillage: {},
  totals: null,
};

/**
 * The authenticated officer's scope, loaded once for the whole dashboard: the
 * villages of their own municipality, per-village attraction/event/review
 * counts, and the reviews left on them. There is no per-officer stats endpoint,
 * so this composes the public resource endpoints (the API still enforces
 * municipality ownership on writes).
 *
 * This is a provider rather than a plain hook because six screens need the same
 * data — overview, villages, attractions, events, feedback and the profile. As
 * a hook, each of those ran the whole fan-out again on mount: one list request
 * plus three per village. Mounted once here, they all read the same state.
 *
 * Reviews are fetched once at `limit=50` and shared: the overview shows the
 * most recent few and the feedback screen filters the full set, so a second
 * per-village pass for the same comments is not needed.
 *
 * Inert for non-officers, so it is safe to mount above all three dashboards.
 */
export function OfficerScopeProvider({ children }) {
  const { user } = useAuth();
  const isOfficer = user?.role === 'officer';
  // Primitive, not the populated object: depending on `user.municipalityId`
  // re-ran the whole fan-out whenever the user object was replaced (every
  // session re-hydration), because its identity changed even though the
  // municipality had not.
  const municipalityId = String(user?.municipalityId?._id ?? user?.municipalityId ?? '');

  const [state, setState] = useState(isOfficer ? { ...EMPTY, loading: true } : EMPTY);

  // Demand-driven: the provider sits above every dashboard screen, but only
  // some of them read the scope. Consumers register on mount, and the fan-out
  // runs only while at least one is mounted — so the village editor, which
  // needs none of this, does not pay for it.
  const [demand, setDemand] = useState(0);
  const activate = useCallback(() => {
    setDemand((n) => n + 1);
    return () => setDemand((n) => Math.max(0, n - 1));
  }, []);
  const wanted = demand > 0;

  const load = useCallback(
    async (bypassCache = false) => {
      if (!isOfficer || !municipalityId) {
        setState(EMPTY);
        return;
      }
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const res = await cachedGet('/villages', {
          params: { includeUnpublished: 'true', limit: 50 },
          bypassCache,
        });
        const mine = res.data.filter(
          (v) => String(v.municipalityId?._id ?? v.municipalityId) === municipalityId
        );

        const perVillage = await Promise.all(
          mine.map(async (v) => {
            const [att, evs, cmts] = await Promise.all([
              cachedGet(`/villages/${v._id}/attractions`, { bypassCache }),
              cachedGet(`/villages/${v._id}/events`, { params: { upcoming: 'true' }, bypassCache }),
              cachedGet(`/villages/${v._id}/comments`, { params: { limit: 50 }, bypassCache }),
            ]);
            return {
              village: v,
              attractions: att.data.length,
              events: evs.data.length,
              reviews: cmts.meta?.total ?? cmts.data.length,
              comments: cmts.data.map((c) => ({
                ...c,
                villageId: v._id,
                villageName: v.name,
                villageSlug: v.slug,
              })),
            };
          })
        );

        const totals = {
          villages: mine.length,
          attractions: perVillage.reduce((n, x) => n + x.attractions, 0),
          events: perVillage.reduce((n, x) => n + x.events, 0),
          reviews: mine.reduce((n, v) => n + (v.ratingCount ?? 0), 0),
        };

        const commentsByVillage = Object.fromEntries(
          perVillage.map((x) => [x.village._id, x.comments])
        );
        const feedback = perVillage
          .flatMap((x) => x.comments)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const villages = mine.map((v) => {
          const pv = perVillage.find((x) => x.village._id === v._id);
          return { ...v, attractionsCount: pv?.attractions ?? 0, eventsCount: pv?.events ?? 0 };
        });

        setState({ loading: false, error: null, villages, feedback, commentsByVillage, totals });
      } catch (error) {
        setState((s) => ({ ...s, loading: false, error }));
      }
    },
    [isOfficer, municipalityId]
  );

  useEffect(() => {
    if (wanted) load(false);
  }, [load, wanted]);

  const value = useMemo(
    () => ({ ...state, activate, refetch: () => load(true) }),
    [state, activate, load]
  );

  return <OfficerScopeContext.Provider value={value}>{children}</OfficerScopeContext.Provider>;
}

const INERT = { ...EMPTY, activate: () => () => {}, refetch: () => {} };

/**
 * Read the shared officer scope. Mounting this hook is what asks the provider
 * to load; unmounting the last consumer releases it. Inert outside a provider.
 */
export function useOfficerScope() {
  const ctx = useContext(OfficerScopeContext) ?? INERT;
  const { activate } = ctx;
  useEffect(() => activate(), [activate]);
  return ctx;
}
