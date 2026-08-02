import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Check, X, ArrowUp, ArrowDown } from 'lucide-react';
import { PageHeader } from '../../../components/dashboard/index.js';
import { Card, Rating, Button, Badge, Skeleton, EmptyState, ErrorState } from '../../../components/ui/index.js';
import { useFetch } from '../../../hooks/useFetch.js';
import { useToast } from '../../../context/ToastContext.jsx';
import api from '../../../lib/api.js';
import { mediaUrl, formatDate, cn } from '../../../lib/utils.js';

export default function AdminModeration() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const { data, loading, error, refetch } = useFetch('/comments/pending', { params: { limit: 50 } });
  const { data: mapVillages } = useFetch('/villages/map');
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(0);
  const listRef = useRef(null);

  useEffect(() => { if (data) setItems(data); }, [data]);
  const avgBySlug = new Map((mapVillages ?? []).map((v) => [v.slug, v.ratingAverage]));

  const moderate = useCallback(
    async (comment, status) => {
      // Optimistic: drop it from the queue, roll back on failure.
      const idx = items.findIndex((c) => c._id === comment._id);
      const prev = items;
      setItems((list) => list.filter((c) => c._id !== comment._id));
      setActive((a) => Math.max(0, Math.min(a, prev.length - 2)));
      try {
        await api.patch(`/comments/${comment._id}/moderate`, { status });
        toast.success(status === 'approved' ? t('dash.common.approved') : t('dash.common.rejected'));
      } catch {
        setItems(prev); // rollback
        setActive(idx);
        toast.error(t('auth.errors.generic'));
      }
    },
    [items, t, toast]
  );

  // Keyboard shortcuts: A approve, R reject, J/K navigate.
  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      const cur = items[active];
      if (e.key === 'j' || e.key === 'J') setActive((a) => Math.min(a + 1, items.length - 1));
      else if (e.key === 'k' || e.key === 'K') setActive((a) => Math.max(a - 1, 0));
      else if ((e.key === 'a' || e.key === 'A') && cur) moderate(cur, 'approved');
      else if ((e.key === 'r' || e.key === 'R') && cur) moderate(cur, 'rejected');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items, active, moderate]);

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div>
      <PageHeader title={t('dash.nav.moderation')} />
      <p className="mb-4 text-small text-ink/50">{t('dash.admin.shortcuts')}</p>

      {loading ? (
        <div className="space-y-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-card" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={ShieldCheck} title={t('dash.admin.noPending')} />
      ) : (
        <ul ref={listRef} className="space-y-4">
          {items.map((c, i) => {
            const vAvg = avgBySlug.get(c.villageId?.slug);
            const raises = vAvg != null ? c.rating >= vAvg : null;
            return (
              <li key={c._id}>
                <Card className={cn('p-5 transition', i === active && 'ring-2 ring-cta')} onMouseEnter={() => setActive(i)}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {c.userId?.avatar ? <img src={mediaUrl(c.userId.avatar)} alt="" className="h-9 w-9 rounded-full object-cover" />
                        : <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-small font-semibold text-primary">{(c.userId?.firstName?.[0] ?? '') + (c.userId?.lastName?.[0] ?? '')}</span>}
                      <div>
                        <p className="font-medium text-ink">{c.userId?.firstName} {c.userId?.lastName}</p>
                        <p className="text-small text-ink/50">{c.villageId?.name} · {formatDate(c.createdAt, i18n.language)}</p>
                      </div>
                    </div>
                    <Rating value={c.rating} size={16} />
                  </div>

                  <p className="mt-3 text-body text-ink/80">{c.content}</p>

                  {vAvg != null && (
                    <p className="mt-3 inline-flex items-center gap-1.5 text-small text-ink/60">
                      {t('dash.authority.avgRating')}: {vAvg.toFixed(1)}
                      <Badge tone={raises ? 'primary' : 'neutral'}>
                        {raises ? <ArrowUp size={12} /> : <ArrowDown size={12} />} {c.rating}★
                      </Badge>
                    </p>
                  )}

                  <div className="mt-4 flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => moderate(c, 'rejected')}><X size={16} className="text-red-500" /> {t('dash.common.reject')}</Button>
                    <Button size="sm" variant="brand" onClick={() => moderate(c, 'approved')}><Check size={16} /> {t('dash.common.approve')}</Button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
