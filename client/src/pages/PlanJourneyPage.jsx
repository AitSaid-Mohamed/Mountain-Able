import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Route, Search, MapPin, ArrowRight } from 'lucide-react';
import Container from '../components/layout/Container.jsx';
import { Input, Card, Rating, Skeleton, ErrorState, EmptyState } from '../components/ui/index.js';
import { useFetch } from '../hooks/useFetch.js';
import { mediaUrl, onImageError, FALLBACK_IMAGE } from '../lib/utils.js';

/**
 * Destination picker for the journey planner (public). The visitor searches the
 * platform's villages by name and continues into the planner for the one they
 * choose. Reached from the header "Plan a journey" nav item.
 */
export default function PlanJourneyPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const { data, loading, error, refetch } = useFetch('/villages/map');

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = data ?? [];
    if (!q) return [];
    return all.filter((v) => v.name.toLowerCase().includes(q)).slice(0, 12);
  }, [data, query]);

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-2xl text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-pill bg-primary/10 text-primary">
          <Route size={28} aria-hidden="true" />
        </span>
        <h1 className="text-display text-ink">{t('plan.title')}</h1>
        <p className="mt-3 text-body-lg text-ink/70">{t('plan.subtitle')}</p>
      </div>

      <div className="mx-auto mt-8 max-w-xl">
        <Input
          label={t('plan.searchLabel')}
          icon={Search}
          placeholder={t('plan.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        <div className="mt-5">
          {error ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : loading ? (
            <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-card" />)}</div>
          ) : query.trim() === '' ? (
            <p className="py-8 text-center text-body text-ink/50">{t('plan.choosePrompt')}</p>
          ) : matches.length === 0 ? (
            <EmptyState icon={MapPin} title={t('plan.noResults')} />
          ) : (
            <ul className="space-y-2">
              {matches.map((v) => (
                <li key={v._id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/villages/${v.slug}/route`)}
                    className="flex w-full items-center gap-4 rounded-card bg-white p-3 text-left shadow-card transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <img
                      src={mediaUrl(v.coverImage) || FALLBACK_IMAGE}
                      alt=""
                      onError={onImageError}
                      className="h-12 w-16 shrink-0 rounded object-cover"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-ink">{v.name}</span>
                      <span className="flex items-center gap-2 text-small text-ink/55">
                        <MapPin size={13} aria-hidden="true" /> {v.region}
                        {v.ratingCount > 0 && <Rating value={v.ratingAverage} size={12} />}
                      </span>
                    </span>
                    <ArrowRight size={18} className="shrink-0 text-primary" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Container>
  );
}
