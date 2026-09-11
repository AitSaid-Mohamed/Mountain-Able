import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils.js';

/**
 * Dashboard sidebar: 300px `bg-cta` column (72px icon-only rail when
 * collapsed). A white logo pill on top, role nav items with an active
 * indicator bar, and Logout pinned to the bottom. Nav is driven by the
 * per-role config, not hardcoded.
 */
export default function DashboardSidebar({
  items = [], base, collapsed, onLogout, onNavigate, badges = {},
}) {
  const { t } = useTranslation();

  return (
    <aside
      className={cn(
        'flex h-full flex-col bg-cta text-white transition-[width] duration-200',
        collapsed ? 'w-[72px]' : 'w-[300px]'
      )}
    >
      {/* Logo pill */}
      <div className="flex items-center justify-center px-4 py-5">
        <div
          className={cn(
            'flex items-center justify-center whitespace-nowrap rounded-pill bg-white font-bold text-cta',
            collapsed ? 'h-11 w-11 text-lg' : 'h-[50px] w-[268px] max-w-full text-[24px]'
          )}
        >
          {collapsed ? 'M' : 'Mountain-Able'}
        </div>
      </div>
      <div className="mx-4 border-t border-white/30" />

      {/* Nav */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-5">
        {items.map(({ to, key, icon: Icon, badge }) => {
          // Officers will not sit watching a queue, so a nav item may carry a
          // count of what is waiting. Rendered only when non-zero: a permanent
          // "0" is noise that trains people to ignore the indicator.
          const count = badge ? badges[badge] ?? 0 : 0;
          return (
          <NavLink
            key={key}
            to={to ? `${base}/${to}` : base}
            end={!to}
            onClick={onNavigate}
            title={collapsed ? t(`dash.nav.${key}`) : undefined}
            className={({ isActive }) =>
              cn(
                'relative flex items-center rounded-card py-2.5 text-body-lg font-medium transition',
                collapsed ? 'justify-center px-2' : 'gap-5 px-4',
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-[#f3f4f4]/90 hover:bg-white/10 hover:text-white'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-white" aria-hidden="true" />
                )}
                <Icon size={collapsed ? 24 : 26} aria-hidden="true" />
                {!collapsed && <span className="flex-1">{t(`dash.nav.${key}`)}</span>}
                {count > 0 && (
                  <span
                    className={cn(
                      'flex min-w-[22px] items-center justify-center rounded-pill bg-white px-1.5 text-small font-semibold text-cta',
                      collapsed && 'absolute right-1 top-1 h-5 min-w-[20px] text-[11px]'
                    )}
                  >
                    {count}
                  </span>
                )}
              </>
            )}
          </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5">
        <button
          type="button"
          onClick={onLogout}
          title={collapsed ? t('nav.logout') : undefined}
          className={cn(
            'flex w-full items-center rounded-card py-2.5 text-body-lg font-medium text-[#f3f4f4]/90 transition hover:bg-white/10 hover:text-white',
            collapsed ? 'justify-center px-2' : 'gap-5 px-4'
          )}
        >
          <LogOut size={collapsed ? 24 : 26} aria-hidden="true" />
          {!collapsed && <span>{t('nav.logout')}</span>}
        </button>
      </div>
    </aside>
  );
}
