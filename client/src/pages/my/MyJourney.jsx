import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, CalendarCheck, Pencil, MessageSquare } from 'lucide-react';
import Card from '../../components/ui/Card.jsx';
import { Rating, Skeleton, EmptyState, ErrorState, Button } from '../../components/ui/index.js';
import VisitDialog from '../../components/village/VisitDialog.jsx';
import { useMe } from '../../context/MeContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { mediaUrl, onImageError, FALLBACK_IMAGE, formatDate } from '../../lib/utils.js';

export default function MyJourney() {
  const { t, i18n } = useTranslation();
  const { visited, loading, error, reload } = useMe();
  const { data: myReviews } = useFetch('/comments/me', { params: { limit: 50 } });
  const [editing, setEditing] = useState(null);

  const reviewByVillage = useMemo(() => {
    const map = {};
    (myReviews ?? []).forEach((r) => { map[r.villageId?._id ?? r.villageId] = r; });
    return map;
  }, [myReviews]);

  // Group by year of visit, newest first (visited is already sorted desc).
  const groups = useMemo(() => {
    const g = {};
    visited.forEach((v) => {
      const year = new Date(v.visitedAt).getFullYear();
      (g[year] ??= []).push(v);
    });
    return Object.entries(g).sort((a, b) => b[0] - a[0]);
  }, [visited]);

  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading) {
    return <div className="space-y-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-card" />)}</div>;
  }
  if (visited.length === 0) {
    return (
      <EmptyState
        icon={CalendarCheck}
        title={t('my.journeyEmpty')}
        action={<Button as={Link} to="/villages" variant="brand">{t('my.journeyEmptyCta')}</Button>}
      />
    );
  }

  return (
    <div className="space-y-10">
      {groups.map(([year, entries]) => (
        <section key={year}>
          <h2 className="mb-4 text-h2 text-ink">{year}</h2>
          <ul className="space-y-4">
            {entries.map((v) => {
              const village = v.villageId;
              if (!village) return null;
              const review = reviewByVillage[village._id];
              return (
                <Card as="li" key={v._id} className="flex flex-col gap-4 p-4 sm:flex-row">
                  <img
                    src={mediaUrl(village.coverImage) || FALLBACK_IMAGE}
                    alt=""
                    onError={onImageError}
                    className="h-32 w-full shrink-0 rounded-card object-cover sm:h-24 sm:w-36"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <Link to={`/villages/${village.slug}`} className="text-h3 text-primary hover:underline">
                          {village.name}
                        </Link>
                        <p className="mt-0.5 inline-flex items-center gap-1 text-small text-ink/50">
                          <MapPin size={13} aria-hidden="true" /> {village.region}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(v)}>
                        <Pencil size={15} /> {t('my.editVisit')}
                      </Button>
                    </div>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-small font-medium text-ink/70">
                      <CalendarCheck size={14} className="text-primary" aria-hidden="true" />
                      {t('my.visitedOn')} {formatDate(v.visitedAt, i18n.language)}
                    </p>
                    {v.note && (
                      <p className="mt-2 rounded-card bg-black/[0.03] p-3 text-small text-ink/70">
                        <span className="font-medium text-ink/50">{t('my.yourNote')}: </span>{v.note}
                      </p>
                    )}
                    {review && (
                      <div className="mt-2 flex items-start gap-2 text-small text-ink/70">
                        <MessageSquare size={14} className="mt-0.5 shrink-0 text-ink/40" aria-hidden="true" />
                        <span>
                          <Rating value={review.rating} size={13} />
                          <span className="ml-1">{review.content}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </ul>
        </section>
      ))}

      {editing && <VisitDialog village={editing.villageId} record={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
