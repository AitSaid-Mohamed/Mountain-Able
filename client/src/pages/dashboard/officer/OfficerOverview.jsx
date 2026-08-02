import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mountain, Sparkles, CalendarDays, MessageSquare, Pencil } from 'lucide-react';
import { PageHeader, Panel } from '../../../components/dashboard/index.js';
import { StatCard, Rating, Badge, Skeleton, ErrorState, EmptyState } from '../../../components/ui/index.js';
import { useOfficerScope } from '../../../hooks/useOfficerScope.js';
import { mediaUrl, onImageError, FALLBACK_IMAGE, formatDate } from '../../../lib/utils.js';

export default function OfficerOverview() {
  const { t, i18n } = useTranslation();
  const { totals, villages, feedback, loading, error, refetch } = useOfficerScope();

  const stats = [
    { icon: Mountain, label: t('dash.stat.villagesManaged'), value: totals?.villages },
    { icon: Sparkles, label: t('dash.stat.totalAttractions'), value: totals?.attractions },
    { icon: CalendarDays, label: t('dash.stat.upcomingEvents'), value: totals?.events },
    { icon: MessageSquare, label: t('dash.stat.reviewsReceived'), value: totals?.reviews },
  ];

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div>
      <PageHeader title={t('dash.nav.overview')} />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) =>
          loading ? <Skeleton key={i} className="h-20 rounded-card" /> : (
            <StatCard key={i} icon={s.icon} value={s.value ?? 0} label={s.label} />
          )
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel icon={Mountain} title={t('dash.officer.yourVillages')} action={
          <Link to="/dashboard/villages" className="text-small font-semibold text-primary hover:underline">{t('common.seeMore')}</Link>
        }>
          {loading ? (
            <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-card" />)}</div>
          ) : villages.length === 0 ? (
            <EmptyState title={t('dash.officer.noVillages')} />
          ) : (
            <ul className="space-y-3">
              {villages.slice(0, 5).map((v) => (
                <li key={v._id} className="flex items-center gap-3">
                  <img src={mediaUrl(v.coverImage) || FALLBACK_IMAGE} alt="" onError={onImageError}
                    className="h-12 w-16 shrink-0 rounded object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{v.name}</p>
                    <Rating value={v.ratingAverage} count={v.ratingCount} size={13} />
                  </div>
                  <Badge tone={v.isPublished ? 'primary' : 'neutral'}>
                    {v.isPublished ? t('dash.common.published') : t('dash.common.draft')}
                  </Badge>
                  <Link to={`/dashboard/villages/${v._id}/edit`} className="text-ink/50 hover:text-primary" aria-label={t('common.edit')}>
                    <Pencil size={16} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel icon={MessageSquare} title={t('dash.officer.latestFeedback')}>
          {loading ? (
            <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 rounded-card" />)}</div>
          ) : feedback.length === 0 ? (
            <EmptyState title={t('dash.officer.noFeedback')} />
          ) : (
            <ul className="space-y-3">
              {feedback.slice(0, 5).map((c) => (
                <li key={c._id} className="border-b border-ink/5 pb-3 last:border-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-small font-medium text-ink">
                      {c.userId?.firstName} {c.userId?.lastName} · {c.villageName}
                    </span>
                    <span className="shrink-0 text-small text-ink/40">{formatDate(c.createdAt, i18n.language)}</span>
                  </div>
                  <Rating value={c.rating} size={13} />
                  <p className="mt-1 line-clamp-2 text-small text-ink/70">{c.content}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
