import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import LoginModal from '../auth/LoginModal.jsx';
import SupportModal from '../support/SupportModal.jsx';
import { useModal } from '../../context/ModalContext.jsx';

/** Scroll to top on navigation (unless linking to an in-page anchor). */
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);
  return null;
}

/** App shell: sticky header, routed page content, footer, and global modals. */
export default function Layout() {
  const { modal, closeModal } = useModal();
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <LoginModal open={modal === 'login'} onClose={closeModal} />
      <SupportModal open={modal === 'support'} onClose={closeModal} />
    </div>
  );
}
