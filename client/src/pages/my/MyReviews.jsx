import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Pencil, Trash2 } from 'lucide-react';
import Card from '../../components/ui/Card.jsx';
import { Rating, Button, Modal, ConfirmDialog, Skeleton, EmptyState, ErrorState } from '../../components/ui/index.js';
import ReviewForm from '../../components/village/ReviewForm.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../context/ToastContext.jsx';
import api from '../../lib/api.js';
import { formatDate } from '../../lib/utils.js';

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

export default function MyReviews() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const { data, loading, error, refetch } = useFetch('/comments/me', { params: { limit: 50 } });
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const reviews = data ?? [];

  const canEdit = (r) => Date.now() - new Date(r.createdAt).getTime() <= EDIT_WINDOW_MS;

  const saveEdit = async ({ rating, content }) => {
    setBusy(true);
    try {
      await api.patch(`/comments/${editing._id}`, { rating, content });
      toast.success(t('village.reviewUpdated'));
      setEditing(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('auth.errors.generic'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/comments/${toDelete._id}`);
      toast.success(t('village.reviewDeleted'));
      setToDelete(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('auth.errors.generic'));
    } finally {
      setBusy(false);
    }
  };

  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (loading) {
    return <div className="space-y-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-card" />)}</div>;
  }
  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title={t('my.reviewsEmpty')}
        action={<Button as={Link} to="/villages" variant="brand">{t('my.reviewsEmptyCta')}</Button>}
      />
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <Card key={r._id} className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              {r.villageId ? (
                <Link to={`/villages/${r.villageId.slug}`} className="text-h3 text-primary hover:underline">
                  {r.villageId.name}
                </Link>
              ) : <span className="text-h3 text-ink">—</span>}
              <div className="mt-1"><Rating value={r.rating} size={15} /></div>
            </div>
            <span className="text-small text-ink/45">{formatDate(r.createdAt, i18n.language)}</span>
          </div>
          <p className="mt-3 text-body text-ink/80">{r.content}</p>
          <div className="mt-3 flex items-center justify-end gap-2">
            {canEdit(r) ? (
              <Button size="sm" variant="ghost" onClick={() => setEditing(r)}><Pencil size={15} /> {t('common.edit')}</Button>
            ) : (
              <span className="text-small text-ink/40">{t('my.editWindowPassed')}</span>
            )}
            <Button size="sm" variant="ghost" onClick={() => setToDelete(r)}><Trash2 size={15} className="text-red-500" /> {t('common.delete')}</Button>
          </div>
        </Card>
      ))}

      {editing && (
        <Modal open onClose={() => setEditing(null)} size="md" title={t('village.editReview')}>
          <div className="p-6">
            <h3 className="mb-4 text-h3 text-ink">{editing.villageId?.name}</h3>
            <ReviewForm
              initial={editing}
              onSubmit={saveEdit}
              submitting={busy}
              submitLabel={t('my.saveChanges')}
              onCancel={() => setEditing(null)}
            />
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        loading={busy}
        message={toDelete ? t('village.confirmDeleteReview') : ''}
      />
    </div>
  );
}
