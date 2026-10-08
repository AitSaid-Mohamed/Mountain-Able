import { useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useModal } from '../context/ModalContext.jsx';
import { canOpen, homeFor } from '../config/dashboardNav.js';
import HomePage from './HomePage.jsx';

/**
 * The `/login` route opens the global login modal over the home page. Once the
 * user is authenticated it forwards to the `redirect` target (set by the
 * dashboard route guard) or home.
 *
 * The redirect records where the *previous* visitor was, not where the person
 * now signing in belongs: logging out on `/admin/moderation` leaves
 * `?redirect=/admin/moderation` behind, and the next person to sign in may be an
 * officer. It is honoured only when the new role can open it; otherwise the user
 * lands in their own area rather than on a 403 page for someone else's.
 */
export default function LoginRoute() {
  const { user } = useAuth();
  const { openLogin } = useModal();
  const [params] = useSearchParams();
  const requested = params.get('redirect');
  // Same-origin paths only — never a protocol-relative `//host`.
  const redirect = requested?.startsWith('/') && !requested.startsWith('//') ? requested : null;

  useEffect(() => {
    if (!user) openLogin();
  }, [user, openLogin]);

  if (user) {
    const target = !redirect ? '/' : canOpen(redirect, user.role) ? redirect : homeFor(user.role);
    return <Navigate to={target} replace />;
  }
  return <HomePage />;
}
