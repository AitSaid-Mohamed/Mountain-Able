import axios from 'axios';

/** localStorage key for the JWT access token. */
export const TOKEN_KEY = 'mountainable_token';

/**
 * Shared axios instance. Base URL comes from VITE_API_URL. A request
 * interceptor attaches the Bearer token; a response interceptor clears the
 * session and redirects to the home page on a 401.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
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
