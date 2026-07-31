import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, LayoutDashboard, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { cn, mediaUrl } from '../../lib/utils.js';

/** Dashboard route for each non-tourist role (dashboards built in a later step). */
const DASHBOARD_PATH = {
  officer: '/dashboard/officer',
  admin: '/dashboard/admin',
  authority: '/dashboard/authority',
};

/** Authenticated avatar dropdown: name, profile, dashboard link, logout. */
export default function UserMenu() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  if (!user) return null;
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
  const dashboard = DASHBOARD_PATH[user.role];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-pill py-1 pl-1 pr-2 transition hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {user.avatar ? (
          <img src={mediaUrl(user.avatar)} alt="" className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-small font-semibold text-white">
            {initials || <User size={16} />}
          </span>
        )}
        <ChevronDown size={16} className={cn('text-ink/50 transition', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-card bg-white py-1 shadow-card"
        >
          <div className="border-b border-ink/10 px-4 py-3">
            <p className="truncate font-semibold text-ink">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-small text-ink/50">{t(`roles.${user.role}`)}</p>
          </div>
          <MenuLink to="/profile" icon={User} onClick={() => setOpen(false)}>
            {t('nav.myProfile')}
          </MenuLink>
          {dashboard && (
            <MenuLink to={dashboard} icon={LayoutDashboard} onClick={() => setOpen(false)}>
              {t('nav.dashboard')}
            </MenuLink>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-body text-ink/80 transition hover:bg-black/5"
          >
            <LogOut size={18} aria-hidden="true" />
            {t('nav.logout')}
          </button>
        </div>
      )}
    </div>
  );
}

function MenuLink({ to, icon: Icon, onClick, children }) {
  return (
    <Link
      to={to}
      role="menuitem"
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 text-body text-ink/80 transition hover:bg-black/5"
    >
      <Icon size={18} aria-hidden="true" />
      {children}
    </Link>
  );
}
