import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mountain, Building2, Sparkles, CalendarDays, Users, MessageSquare, UserPlus, ShieldCheck, ArrowRight } from 'lucide-react';
import { PageHeader, Panel } from '../../../components/dashboard/index.js';
import { StatCard, Skeleton, Badge, Rating, EmptyState } from '../../../components/ui/index.js';
import { useFetch } from '../../../hooks/useFetch.js';
import { formatDate } from '../../../lib/utils.js';

export default function AdminOverview() {
  const { t, i18n } = useTranslation();
  const { data: ov, loading } = useFetch('/stats/overview');
  const requests = useFetch('/officer-requests', { params: { status: 'pending', limit: 5 } });
  const pending = useFetch('/comments/pending', { params: { limit: 5 } });

  const stats = [
    { icon: Mountain, label: t('dash.stat.villagesOnPlatform'), value: ov?.villages },
    { icon: Building2, label: t('dash.stat.municipalities'), value: ov?.municipalities },
    { icon: Sparkles, label: t('dash.stat.totalAttractions'), value: ov?.attractions },
    { icon: CalendarDays, label: t('dash.stat.upcomingEvents'), value: ov?.events },
    { icon: Users, label: t('dash.stat.tourists'), value: ov?.tourists },
    { icon: MessageSquare, label: t('dash.stat.comments'), value: ov?.comments },
  ];

  return (
    <div>
      <PageHeader title={t('dash.nav.overview')} />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s, i) =>
          loading ? <Skeleton key={i} className="h-20 rounded-card" /> : <StatCard key={i} icon={s.icon} value={s.value ?? 0} label={s.label} />
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel
          icon={UserPlus}
          title={t('dash.admin.pendingRequests')}
          action={<Badge tone="amber">{requests.meta?.total ?? 0}</Badge>}
        >
          {(requests.data ?? []).length === 0 ? (
            <EmptyState title={t('dash.admin.noRequests')} />
          ) : (
            <ul className="space-y-2">
              {requests.data.map((r) => (
                <li key={r._id} className="flex items-center justify-between gap-2 text-small">
                  <span className="truncate"><b className="text-ink">{r.requesterName}</b> · {r.municipalityName}</span>
                  <span className="shrink-0 text-ink/40">{formatDate(r.createdAt, i18n.language)}</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/admin/officer-requests" className="mt-4 inline-flex items-center gap-1 text-small font-semibold text-primary hover:underline">
            {t('dash.admin.review')} <ArrowRight size={15} />
          </Link>
        </Panel>

        <Panel
          icon={ShieldCheck}
          title={t('dash.admin.awaitingModeration')}
          action={<Badge tone="amber">{pending.meta?.total ?? 0}</Badge>}
        >
          {(pending.data ?? []).length === 0 ? (
            <EmptyState title={t('dash.admin.noPending')} />
          ) : (
            <ul className="space-y-2">
              {pending.data.map((c) => (
                <li key={c._id} className="flex items-center justify-between gap-2 text-small">
                  <span className="truncate"><b className="text-ink">{c.userId?.firstName}</b> · {c.villageId?.name}</span>
                  <Rating value={c.rating} size={13} />
                </li>
              ))}
            </ul>
          )}
          <Link to="/admin/moderation" className="mt-4 inline-flex items-center gap-1 text-small font-semibold text-primary hover:underline">
            {t('dash.admin.moderationQueue')} <ArrowRight size={15} />
          </Link>
        </Panel>
      </div>
    </div>
  );
}
