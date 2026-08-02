import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Pencil, Trash2, LogIn, Clock, EyeOff } from 'lucide-react';
import { Card, Rating, Button, Badge, EmptyState, Spinner, Pagination, ConfirmDialog } from '../ui/index.js';
import ReviewForm from './ReviewForm.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useModal } from '../../context/ModalContext.jsx';
import api from '../../lib/api.js';
import { formatDate, cn, mediaUrl } from '../../lib/utils.js';

const PAGE_SIZE = 10;

/**
 * Reviews block for the village detail page — designed here since the Figma
 * omits it. Shows the average + a 1–5 distribution, a client-paginated comment
 * list, and a context-aware form (login prompt / new review / edit existing).
 */
export default function ReviewsSection({ village, onRatingChange }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { openLogin } = useModal();

  // Fetch up to 50 approved reviews; compute distribution and paginate locally.
  const { data: comments, loading, refetch } = useFetch(`/villages/${village._id}/comments`, {
    params: { limit: 50 },
  });
  const list = comments ?? [];

  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const myReview = useMemo(
    () => (user ? list.find((c) => c.userId?._id === user._id || c.userId === user._id) : null),
    [list, user]
  );

  // The endpoint adds the caller's own review whatever its status, so the
  // public list and the distribution are taken from the approved subset only —
  // an unapproved review must not shift the breakdown it is not counted in.
  // The author still sees their own in the "Your review" card above.
  const approved = useMemo(() => list.filter((c) => c.status === 'approved'), [list]);

  const distribution = useMemo(() => {
    const buckets = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    approved.forEach((c) => { buckets[c.rating] = (buckets[c.rating] ?? 0) + 1; });
    return buckets;
  }, [approved]);

  const total = village.ratingCount ?? approved.length;
  const totalPages = Math.max(1, Math.ceil(approved.length / PAGE_SIZE));
  const pageItems = approved.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const afterChange = async (msg) => {
    setFeedback(msg);
    setEditing(false);
    await refetch();
    onRatingChange?.();
  };

  const createReview = async ({ rating, content }) => {
    setSubmitting(true);
    try {
      await api.post(`/villages/${village._id}/comments`, { rating, content });
      await afterChange(t('village.reviewSubmitted'));
    } catch (err) {
      setFeedback(err.response?.data?.message ?? t('auth.errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  const updateReview = async ({ rating, content }) => {
    setSubmitting(true);
    try {
      await api.patch(`/comments/${myReview._id}`, { rating, content });
      await afterChange(t('village.reviewUpdated'));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReview = async () => {
    setSubmitting(true);
    try {
      await api.delete(`/comments/${myReview._id}`);
      setConfirmDelete(false);
      await afterChange(t('village.reviewDeleted'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-12">
      <div className="flex items-center gap-4">
        <h2 className="shrink-0 text-h2 text-ink">{t('village.reviewsHeading')}</h2>
        <span className="h-px flex-1 bg-ink/15" aria-hidden="true" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Average + distribution */}
        <Card className="h-fit p-6 text-center">
          <div className="text-display leading-none text-ink">
            {village.ratingAverage ? village.ratingAverage.toFixed(1) : '—'}
          </div>
          <div className="mt-2 flex justify-center">
            <Rating value={village.ratingAverage} size={20} />
          </div>
          <p className="mt-2 text-small text-ink/60">{t('village.basedOn', { count: total })}</p>

          <div className="mt-5 space-y-1.5 text-left">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = distribution[star] ?? 0;
              const pct = approved.length ? (count / approved.length) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-small">
                  <span className="w-3 text-ink/60">{star}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/10">
                    <div className="h-full rounded-full bg-[#f5b638]" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-5 text-right text-ink/50">{count}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Form + list */}
        <div>
          {feedback && (
            <div className="mb-4 rounded-card bg-primary/10 px-4 py-3 text-small text-primary" role="status">
              {feedback}
            </div>
          )}

          {/* Context-aware form area */}
          {!user ? (
            <Card className="mb-6 flex flex-col items-center gap-3 p-6 text-center">
              <LogIn size={28} className="text-primary" />
              <p className="text-body font-medium text-ink">{t('village.loginToReview')}</p>
              <p className="text-small text-ink/60">{t('village.loginToReviewHint')}</p>
              <Button variant="brand" onClick={openLogin}>{t('nav.login')}</Button>
            </Card>
          ) : myReview ? (
            <Card className="mb-6 p-6">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-h3 text-ink">{t('village.yourReview')}</h3>
                  {myReview.status === 'pending' && (
                    <Badge tone="amber" icon={Clock}>{t('village.pendingBadge')}</Badge>
                  )}
                  {myReview.status === 'rejected' && (
                    <Badge tone="neutral" icon={EyeOff}>{t('village.rejectedBadge')}</Badge>
                  )}
                </div>
                {!editing && (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                      <Pencil size={16} /> {t('common.edit')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>
                      <Trash2 size={16} /> {t('common.delete')}
                    </Button>
                  </div>
                )}
              </div>
              {editing ? (
                <ReviewForm
                  initial={myReview}
                  onSubmit={updateReview}
                  submitting={submitting}
                  submitLabel={t('village.updateReview')}
                  onCancel={() => setEditing(false)}
                />
              ) : (
                <div>
                  <Rating value={myReview.rating} size={18} />
                  <p className="mt-2 text-body text-ink/80">{myReview.content}</p>
                  {myReview.status !== 'approved' && (
                    <p className="mt-3 text-small text-ink/60">
                      {t(myReview.status === 'pending' ? 'village.pendingNote' : 'village.rejectedNote')}
                    </p>
                  )}
                </div>
              )}
            </Card>
          ) : user.role === 'tourist' ? (
            <Card className="mb-6 p-6">
              <h3 className="mb-4 text-h3 text-ink">{t('village.writeReview')}</h3>
              <ReviewForm onSubmit={createReview} submitting={submitting} submitLabel={t('village.submitReview')} />
            </Card>
          ) : null}

          {/* List */}
          {loading ? (
            <div className="flex justify-center py-10 text-ink/40">
              <Spinner size={24} />
            </div>
          ) : approved.length === 0 ? (
            <EmptyState icon={MessageSquare} title={t('village.noReviewsYet')} />
          ) : (
            <>
              <ul className="space-y-4">
                {pageItems.map((c) => (
                  <ReviewItem key={c._id} comment={c} locale={i18n.language} isMine={myReview?._id === c._id} />
                ))}
              </ul>
              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination page={page} totalPages={totalPages} onChange={setPage} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={deleteReview}
        loading={submitting}
        message={t('village.confirmDeleteReview')}
      />
    </section>
  );
}

function ReviewItem({ comment, locale, isMine }) {
  const author = comment.userId ?? {};
  const initials = `${author.firstName?.[0] ?? ''}${author.lastName?.[0] ?? ''}`.toUpperCase();
  return (
    <Card className={cn('flex gap-4 p-5', isMine && 'ring-1 ring-primary/30')}>
      {author.avatar ? (
        <img src={mediaUrl(author.avatar)} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-small font-semibold text-primary">
          {initials || '?'}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold text-ink">
            {author.firstName} {author.lastName}
          </p>
          <span className="text-small text-ink/45">{formatDate(comment.createdAt, locale)}</span>
        </div>
        <div className="mt-1">
          <Rating value={comment.rating} size={15} />
        </div>
        <p className="mt-2 text-body text-ink/80">{comment.content}</p>
      </div>
    </Card>
  );
}
