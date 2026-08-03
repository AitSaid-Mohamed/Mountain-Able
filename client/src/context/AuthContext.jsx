import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { TOKEN_KEY, isNetworkError } from '../lib/api.js';
import { cachedGet, invalidate } from '../lib/requestCache.js';

const AuthContext = createContext(null);

/**
 * Authentication provider. Holds the current `user`, exposes `login`,
 * `register`, `logout`, and a `loading` flag while the session is hydrated from
 * `GET /api/auth/me` on mount. The JWT lives in localStorage.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Set when the session couldn't be hydrated because the server was
  // unreachable (network error) rather than because the token was invalid.
  const [authError, setAuthError] = useState(null);

  const hydrate = useCallback(async (force = false) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Through the shared cache so a StrictMode double-invoke (or two guards
      // hydrating at once) shares one request instead of opening two.
      const res = await cachedGet('/auth/me', { bypassCache: force });
      setUser(res.data.user);
      setAuthError(null);
    } catch (err) {
      // Only a rejected/expired token (401/403) invalidates the session. If the
      // server was simply unreachable (network error, restarting) — or replied
      // 429, or failed outright with a 5xx — keep the token so the session
      // recovers, and record the error so the guard can offer a retry instead
      // of a redirect. Treating any failure as a rejected token logs people out
      // for reasons that have nothing to do with their credentials.
      const status = err.response?.status;
      const rejected = status === 401 || status === 403;
      if (isNetworkError(err) || !rejected) {
        setAuthError(err);
      } else {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
        setAuthError(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrate();
    // A 401 from any request clears the session globally.
    const onUnauthorized = () => setUser(null);
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, [hydrate]);

  const persist = (token, nextUser) => {
    localStorage.setItem(TOKEN_KEY, token);
    // Drop everything cached for the previous session — the cache is keyed by
    // URL, not by user, so a signed-in read must never survive a switch.
    invalidate();
    setUser(nextUser);
  };

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: u } = res.data.data;
    persist(token, u);
    return u;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await api.post('/auth/register', payload);
    const { token, user: u } = res.data.data;
    persist(token, u);
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    invalidate();
    setUser(null);
    setAuthError(null);
  }, []);

  const updateUser = useCallback((patch) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const hasToken = Boolean(localStorage.getItem(TOKEN_KEY));
  const value = { user, loading, authError, hasToken, reloadUser: () => hydrate(true), login, register, logout, updateUser };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Access the auth context. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
