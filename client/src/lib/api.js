import axios from 'axios';

/** localStorage key for the JWT access token. */
export const TOKEN_KEY = 'mountainable_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

/**
 * True when a request failed without an HTTP response — i.e. the server was
 * unreachable (down, restarting, DNS/CORS failure) or the request timed out.
 * This is NOT an authentication failure and must never clear the session.
 */
export const isNetworkError = (error) => Boolean(error?.isAxiosError && !error.response);

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only a genuine 401 (rejected/expired token) clears the session. A network
    // error (no `error.response`) means the server was unreachable — we leave
    // the session intact and let the calling view surface it as a retryable
    // connection error, so the user stays on the page they were on.
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      // Avoid redirect loops on the auth endpoints themselves.
      const url = error.config?.url ?? '';
      if (!url.includes('/auth/login') && !url.includes('/auth/me')) {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

/** Convenience: unwrap the API envelope `{ success, data, meta }`. */
export const unwrap = (res) => res.data;

export default api;
