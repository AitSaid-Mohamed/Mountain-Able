import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Container from '../../components/layout/Container.jsx';
import { cn } from '../../lib/utils.js';

const TABS = [
  { to: '/my', key: 'overview', end: true },
  { to: '/my/visited', key: 'journey', end: false },
  { to: '/my/favorites', key: 'saved', end: false },
  { to: '/my/routes', key: 'routes', end: false },
  { to: '/my/reviews', key: 'reviews', end: false },
];

/**
 * Tourist "My space" — rendered inside the public layout (header + footer),
 * with tab navigation rather than an admin-style sidebar. Guarded to tourists
 * by the route wrapper.
 */
export default function MyLayout() {
  const { t } = useTranslation();
  return (
    <Container className="py-10">
      <h1 className="text-display text-ink">{t('my.title')}</h1>
      <p className="mt-2 max-w-2xl text-body-lg text-ink/60">{t('my.subtitle')}</p>

      <nav className="mt-6 flex flex-wrap gap-2 border-b border-ink/10 pb-px" aria-label="My space">
        {TABS.map((tab) => (
          <NavLink
            key={tab.key}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                'rounded-t-card px-4 py-2.5 text-body font-medium transition',
                isActive
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-ink/60 hover:text-primary'
              )
            }
          >
            {t(`my.tabs.${tab.key}`)}
          </NavLink>
        ))}
      </nav>

      <div className="mt-8">
        <Outlet />
      </div>
    </Container>
  );
}
