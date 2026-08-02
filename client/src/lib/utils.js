/** Join truthy class names. A tiny `clsx` replacement. */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/** A neutral fallback image for broken/missing sources. */
export const FALLBACK_IMAGE =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <rect width="600" height="400" fill="#e8e6e1"/>
      <path d="M0 300 L180 160 L300 250 L420 130 L600 300 Z" fill="#cfcabf"/>
      <circle cx="470" cy="90" r="36" fill="#dcd8cd"/>
    </svg>`
  );

/** Origin of the API server (VITE_API_URL without the trailing `/api`). */
const API_ORIGIN = (import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api').replace(/\/api\/?$/, '');

/**
 * Resolve an image reference for use in <img src>. Absolute URLs (e.g. seeded
 * Unsplash links) are returned unchanged; server-relative upload paths
 * (`/uploads/...`) are prefixed with the API origin so they load from the
 * backend rather than the frontend dev server.
 */
export function mediaUrl(path) {
  if (!path) return path;
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  if (path.startsWith('/uploads')) return `${API_ORIGIN}${path}`;
  return path;
}

/** onError handler that swaps a broken image for the fallback (once). */
export function onImageError(e) {
  if (e.currentTarget.dataset.fallback) return;
  e.currentTarget.dataset.fallback = '1';
  e.currentTarget.src = FALLBACK_IMAGE;
}

/** Format a distance in metres as km (1 decimal) or m. */
export function formatDistance(metres) {
  if (metres == null) return '—';
  return metres >= 1000 ? `${(metres / 1000).toFixed(1)} km` : `${Math.round(metres)} m`;
}

/** Format a duration in seconds as "Xh Ym" or "Ym". */
export function formatDuration(seconds) {
  if (seconds == null) return '—';
  const mins = Math.round(seconds / 60);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** Format a date range for events, respecting the active locale. */
export function formatDate(value, locale = 'en') {
  if (!value) return '';
  return new Date(value).toLocaleDateString(locale === 'it' ? 'it-IT' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
