import { useState, useEffect, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import DashboardSidebar from '../components/ui/DashboardSidebar.jsx';
import DashboardTopbar from '../components/ui/DashboardTopbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { DashboardContext } from '../context/DashboardContext.js';
import { OfficerScopeProvider } from '../context/OfficerScopeContext.jsx';
import { useMediaQuery } from '../hooks/useMediaQuery.js';
import { DASHBOARDS } from '../config/dashboardNav.js';
import { useFetch } from '../hooks/useFetch.js';

/**
 * Shared chrome for all three dashboards, driven by the per-role config passed
 * in. Handles the collapsible sidebar, breadcrumb, the read-only banner for
 * pending officers, and exposes `{ readOnly, config, role }` to child screens.
 */
export default function DashboardLayout({ role }) {
  const config = DASHBOARDS[role];
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [collapsed, setCollapsed] = useState(!isDesktop);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Collapse by default under lg.
  useEffect(() => setCollapsed(!isDesktop), [isDesktop]);

  const readOnly = user?.role === 'officer' && user?.status === 'pending';

  // Coordination inbox counts for the sidebar badge. One small read on mount
  // through the shared cache — not a polling loop: the natural rhythm of
  // inter-municipal correspondence is days, so a count that is right whenever
  // the officer opens the dashboard is proportionate. (Email would be better
  // still, and is noted as a limitation in the report rather than pretended at.)
  const { data: inbox } = useFetch(role === 'officer' ? '/coordination/inbox' : null);

  // Breadcrumb: role title → current section (→ deeper segment label).
  const breadcrumb = useMemo(() => {
    const crumbs = [t(config.titleKey)];
    const rest = location.pathname.replace(config.base, '').split('/').filter(Boolean);
    if (rest.length === 0) {
      crumbs.push(t('dash.nav.overview'));
    } else {
      const item = config.items.find((i) => i.to === rest[0]);
      crumbs.push(item ? t(`dash.nav.${item.key}`) : rest[0]);
      if (rest.length > 1) crumbs.push(t('dash.editing'));
    }
    return crumbs;
  }, [location.pathname, config, t]);

  const ctx = useMemo(() => ({ readOnly, config, role }), [readOnly, config, role]);

  return (
    <DashboardContext.Provider value={ctx}>
      {/* Officer scope is loaded once here, not per screen — six dashboard
          pages read the same villages/attractions/events/reviews. Inert for
          admins and authorities. */}
      <OfficerScopeProvider>
        <div className="flex h-screen overflow-hidden bg-[#f9fcfb]">
          {/* Sidebar — off-canvas on mobile */}
          <div
            className={`${mobileOpen ? 'fixed inset-y-0 left-0 z-40' : 'hidden'} lg:static lg:z-auto lg:block`}
          >
            <DashboardSidebar
              badges={inbox ?? {}}
              items={config.items}
              base={config.base}
              collapsed={collapsed && !mobileOpen}
              onLogout={logout}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
          {mobileOpen && (
            <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          )}

          {/* Main column */}
          <div className="flex min-w-0 flex-1 flex-col">
            <DashboardTopbar
              onToggleSidebar={() => (isDesktop ? setCollapsed((c) => !c) : setMobileOpen((o) => !o))}
              breadcrumb={breadcrumb}
              user={user}
              base={config.base}
              onLogout={logout}
            />

            {readOnly && (
              <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-6 py-2.5 text-small text-amber-800">
                <AlertTriangle size={18} className="shrink-0" aria-hidden="true" />
                {t('dash.readOnlyBanner')}
              </div>
            )}

            <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
              <div className="mx-auto w-full max-w-[1080px]">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </OfficerScopeProvider>
    </DashboardContext.Provider>
  );
}
