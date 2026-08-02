import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, User } from 'lucide-react';
import Container from './Container.jsx';
import Logo from './Logo.jsx';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import UserMenu from './UserMenu.jsx';
import { Button } from '../ui/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useModal } from '../../context/ModalContext.jsx';
import { cn } from '../../lib/utils.js';

const NAV = [
  { to: '/', key: 'home', end: true },
  { to: '/villages', key: 'villages' },
  { to: '/plan', key: 'planJourney' },
  { to: '/events', key: 'events' },
  { to: '/about', key: 'about' },
];

export default function Header() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { openLogin } = useModal();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinkClass = ({ isActive }) =>
    cn(
      'text-body transition hover:text-primary',
      isActive ? 'font-semibold text-primary' : 'text-ink'
    );

  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream/95 backdrop-blur">
      <Container className="flex h-[64px] items-center justify-between gap-4">
        <Logo />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
              {t(`nav.${item.key}`)}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <LanguageSwitcher />
          {user ? (
            <UserMenu />
          ) : (
            <Button variant="brand" onClick={openLogin} className="min-w-[130px]">
              <User size={18} aria-hidden="true" />
              {t('nav.login')}
            </Button>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="rounded-md p-2 text-ink md:hidden"
          aria-label={mobileOpen ? t('nav.closeMenu') : t('nav.openMenu')}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </Container>

      {/* Mobile sheet */}
      {mobileOpen && (
        <div className="border-t border-ink/10 bg-cream md:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'rounded-card px-3 py-2.5 text-body',
                    isActive ? 'bg-primary/10 font-semibold text-primary' : 'text-ink'
                  )
                }
              >
                {t(`nav.${item.key}`)}
              </NavLink>
            ))}
            <div className="mt-3 flex items-center justify-between border-t border-ink/10 pt-4">
              <LanguageSwitcher />
              {user ? (
                <UserMenu />
              ) : (
                <Button
                  variant="brand"
                  onClick={() => {
                    setMobileOpen(false);
                    openLogin();
                  }}
                >
                  <User size={18} aria-hidden="true" />
                  {t('nav.login')}
                </Button>
              )}
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
