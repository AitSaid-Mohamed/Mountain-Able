import { useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useModal } from '../context/ModalContext.jsx';
import HomePage from './HomePage.jsx';

/**
 * The `/login` route opens the global login modal over the home page. Once the
 * user is authenticated it forwards to the `redirect` target (set by the
 * dashboard route guard) or home.
 */
export default function LoginRoute() {
  const { user } = useAuth();
  const { openLogin } = useModal();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '/';

  useEffect(() => {
    if (!user) openLogin();
  }, [user, openLogin]);

  if (user) return <Navigate to={redirect} replace />;
  return <HomePage />;
}
