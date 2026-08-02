import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPinCheck, Heart, MessageSquare, Star, Map as MapIcon } from 'lucide-react';
import Card from '../../components/ui/Card.jsx';
import { StatCard, Skeleton, ErrorState, EmptyState } from '../../components/ui/index.js';
import VillagesMap from '../../components/villages/VillagesMap.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useMe } from '../../context/MeContext.jsx';
import { formatDate } from '../../lib/utils.js';

export default function MyOverview() {
  const { t, i18n } = useTranslation();
  const { data: stats, loading, error, refetch } = useFetch('/me/stats');
  const { visited, favorites } = useMe();
  const { data: myReviews } = useFetch('/comments/me', { params: { limit: 5 } });
  const { data: municipalities } = useFetch('/municipalities');

  const totalRegions = useMemo(
    () => new Set((municipalities ?? []).map((m) => m.region)).size,
    [municipalities]
  );

  const mapVillages = useMemo(
    () => visited.map((v) => v.villageId).filter((v) => v && v.location),
    [visited]
  );

  // Interleave visits, favourites and reviews by date, newest first.
  const activity = useMemo(() => {
    const items = [
      ...visited.map((v) => ({ type: 'visited', date: v.visitedAt, village: v.villageId })),
      ...favorites.map((f) => ({ type: 'favorited', date: f.createdAt, village: f.villageId })),
      ...(myReviews ?? []).map((r) => ({ type: 'reviewed', date: r.createdAt, village: r.villageId })),
    ];
    return items
      .filter((i) => i.village)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8);
  }, [visited, favorites, myReviews]);

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const cards = [
    { icon: MapPinCheck, label: t('my.stats.visited'), value: stats?.villagesVisited },
    { icon: Heart, label: t('my.stats.favorited'), value: stats?.villagesFavorited },
    { icon: MessageSquare, label: t('my.stats.reviews'), value: stats?.reviewsWritten },
    { icon: Star, label: t('my.stats.avgRating'), value: stats?.averageRatingGiven || '—' },
    { icon: MapIcon, label: t('my.stats.regions'), value: stats?.distinctRegionsVisited },
  ];

  const ACT_ICON = { visited: MapPinCheck, favorited: Heart, reviewed: MessageSquare };

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-card" />)
          : cards.map((c, i) => <StatCard key={i} icon={c.icon} value={c.value ?? 0} label={c.label} />)}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        {/* Map */}
        <Card className="overflow-hidden">
          <div className="border-b border-ink/10 px-5 py-4">
            <h2 className="text-h3 text-ink">{t('my.mapTitle')}</h2>
          </div>
          {mapVillages.length === 0 ? (
            <EmptyState
              icon={MapPinCheck}
              title={t('my.mapEmpty')}
              action={<Link to="/villages" className="font-semibold text-primary hover:underline">{t('my.journeyEmptyCta')}</Link>}
            />
          ) : (
            <div className="h-[360px]">
              <VillagesMap villages={mapVillages} />
            </div>
          )}
        </Card>

        <div className="space-y-6">
          {/* Regions explored */}
          <Card className="p-5">
            <h2 className="text-h3 text-ink">{t('my.regionsExplored')}</h2>
            <p className="mt-2 text-small text-ink/60">
              {t('my.regionsExploredHint', { visited: stats?.distinctRegionsVisited ?? 0, total: totalRegions || '—' })}
            </p>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-ink/10">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: totalRegions ? `${Math.min(100, ((stats?.distinctRegionsVisited ?? 0) / totalRegions) * 100)}%` : '0%' }}
              />
            </div>
            {stats?.regionsVisited?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {stats.regionsVisited.map((r) => (
                  <span key={r} className="rounded-pill bg-primary/10 px-2.5 py-0.5 text-small text-primary">{r}</span>
                ))}
              </div>
            )}
          </Card>

          {/* Recent activity */}
          <Card className="p-5">
            <h2 className="text-h3 text-ink">{t('my.recentActivity')}</h2>
            {activity.length === 0 ? (
              <p className="mt-3 text-body text-ink/50">{t('my.noActivity')}</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {activity.map((a, i) => {
                  const Icon = ACT_ICON[a.type];
                  return (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon size={15} aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1 text-small">
                        <Link to={`/villages/${a.village.slug}`} className="font-medium text-ink hover:text-primary">
                          {t(`my.activity${a.type[0].toUpperCase()}${a.type.slice(1)}`, { village: a.village.name })}
                        </Link>
                        <div className="text-ink/45">{formatDate(a.date, i18n.language)}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
