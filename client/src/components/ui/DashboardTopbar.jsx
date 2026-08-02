import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PanelLeft, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useModal } from '../../context/ModalContext.jsx';
import { mediaUrl, cn } from '../../lib/utils.js';

/**
 * Dashboard topbar: sidebar toggle + breadcrumb on the left; a white bar with a
 * Support link and an avatar dropdown (Profile / Settings / Logout) on the right.
 */
export default function DashboardTopbar({ onToggleSidebar, breadcrumb = [], user, base, onLogout }) {
  const { t } = useTranslation();
  const { openSupport } = useModal();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <header className="flex items-center justify-between gap-4 bg-[#f9fcfb] px-4 py-3 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="rounded-md p-2 text-ink/70 transition hover:bg-black/5"
        >
          <PanelLeft size={26} />
        </button>
        <nav aria-label="Breadcrumb" className="hidden min-w-0 truncate text-[15px] font-light text-[#808080] sm:block">
          {breadcrumb.map((b, i) => (
            <span key={i}>
              {i > 0 && <span className="mx-1.5">/</span>}
              {b}
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3 rounded-card bg-white px-3 py-1.5 drop-shadow-[0px_2px_2.5px_rgba(0,0,0,0.25)]">
        <button
          type="button"
          onClick={openSupport}
          className="hidden text-body-lg font-medium text-ink/80 transition hover:text-primary sm:block"
        >
          {t('footer.support')}
        </button>
        <span className="hidden h-6 w-px bg-ink/10 sm:block" aria-hidden="true" />
        <div ref={ref} className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-haspopup="menu"
            className="flex items-center gap-2"
          >
            {user?.avatar ? (
              <img src={mediaUrl(user.avatar)} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-small font-semibold text-white">
                {initials || <User size={18} />}
              </span>
            )}
            <span className="hidden text-body-lg text-ink md:block">{user?.firstName}</span>
            <ChevronDown size={18} className={cn('text-ink/50 transition', open && 'rotate-180')} />
          </button>
          {open && (
            <div role="menu" className="absolute right-0 z-40 mt-2 w-48 overflow-hidden rounded-card bg-white py-1 shadow-card">
              <MenuLink to={`${base}/profile`} icon={User} onClick={() => setOpen(false)}>
                {t('nav.myProfile')}
              </MenuLink>
              <MenuLink to={`${base}/profile`} icon={Settings} onClick={() => setOpen(false)}>
                {t('dash.settings')}
              </MenuLink>
              <button
                type="button"
                role="menuitem"
                onClick={() => { setOpen(false); onLogout(); }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-body text-ink/80 hover:bg-black/5"
              >
                <LogOut size={18} aria-hidden="true" />
                {t('nav.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function MenuLink({ to, icon: Icon, onClick, children }) {
  return (
    <Link to={to} role="menuitem" onClick={onClick} className="flex items-center gap-3 px-4 py-2.5 text-body text-ink/80 hover:bg-black/5">
      <Icon size={18} aria-hidden="true" />
      {children}
    </Link>
  );
}
