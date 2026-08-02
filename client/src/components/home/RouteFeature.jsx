import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Route, ChevronRight, TrendingUp, Fuel, MapPinned } from 'lucide-react';
import Container from '../layout/Container.jsx';

/**
 * Home section introducing the journey planner: mountain villages are hard to
 * reach, and this is what the guide does about it. Full-bleed accent band with
 * a call to action into the destination picker.
 */
export default function RouteFeature() {
  const { t } = useTranslation();
  const points = [
    { icon: TrendingUp, key: 'terrain' },
    { icon: Fuel, key: 'services' },
    { icon: MapPinned, key: 'discover' },
  ];

  return (
    <section className="bg-primary/5 py-16">
      <Container className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-card bg-primary/15 text-primary">
            <Route size={24} aria-hidden="true" />
          </span>
          <h2 className="text-h1 text-ink">{t('home.routeHeading')}</h2>
          <p className="mt-3 text-h3 font-normal text-primary">{t('home.routeLead')}</p>
          <p className="mt-4 max-w-xl text-body-lg text-ink/70">{t('home.routeBody')}</p>
          <Link
            to="/plan"
            className="mt-7 inline-flex items-center gap-2 rounded-pill bg-cta px-7 py-3 text-body font-semibold text-white transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cta/50"
          >
            {t('home.routeCta')}
            <ChevronRight size={20} aria-hidden="true" />
          </Link>
        </div>

        <ul className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {points.map((p) => (
            <li key={p.key} className="flex items-start gap-3 rounded-card bg-white p-4 shadow-card">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card bg-primary/10 text-primary">
                <p.icon size={20} aria-hidden="true" />
              </span>
              <p className="text-body text-ink/75">{t(`home.routePoint.${p.key}`)}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
