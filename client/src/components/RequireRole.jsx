import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from './ui/Spinner.jsx';
import ErrorState from './ui/ErrorState.jsx';
import ForbiddenPage from '../pages/ForbiddenPage.jsx';

/**
 * Route guard for the dashboards.
 * - While the session hydrates → spinner.
 * - Couldn't hydrate because the server was unreachable (but a token exists) →
 *   a retryable connection screen, NOT a logout/redirect. The session is intact
 *   and recovers once the server is back.
 * - Genuinely unauthenticated → redirect to /login with a `redirect` param.
 * - Authenticated but wrong role → a 403 page (not a silent redirect).
 */
export default function RequireRole({ roles, children }) {
  const { user, loading, authError, hasToken, reloadUser } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-primary">
        <Spinner size={32} />
      </div>
    );
  }

  if (!user) {
    // We hold a token but couldn't reach the server to verify it — don't log the
    // user out over a transient outage; let them retry.
    if (hasToken && authError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#f9fcfb]">
          <ErrorState error={authError} onRetry={reloadUser} />
        </div>
      );
    }
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <ForbiddenPage />;
  }

  return children;
}
