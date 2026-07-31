import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useModal } from '../context/ModalContext.jsx';

/**
 * The `/login` route doesn't render its own page — it opens the global login
 * modal over the home page. Authenticated users are sent home directly.
 */
export default function LoginRoute() {
  const { user } = useAuth();
  const { openLogin } = useModal();

  useEffect(() => {
    if (!user) openLogin();
  }, [user, openLogin]);

  return <Navigate to="/" replace />;
}
