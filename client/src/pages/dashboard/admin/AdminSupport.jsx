import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LifeBuoy, Mail, User, Check, Undo2, Trash2 } from 'lucide-react';
import { PageHeader, FieldRow } from '../../../components/dashboard/index.js';
import {
  Card, Button, Badge, Select, ConfirmDialog, Skeleton, EmptyState, ErrorState,
} from '../../../components/ui/index.js';
import { useFetch } from '../../../hooks/useFetch.js';
import { useToast } from '../../../context/ToastContext.jsx';
import api from '../../../lib/api.js';
import { formatDate } from '../../../lib/utils.js';

/**
 * Support inbox — the messages sent through the public footer dialog.
 * Filter lives in the URL like every other list view in the project.
 */
export default function AdminSupport() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? 'new';

  const { data, meta, loading, error, refetch } = useFetch('/support', {
    params: { ...(status !== 'all' && { status }), limit: 50 },
  });
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const rows = data ?? [];

  const setStatus = (next) => {
    const p = new URLSearchParams(params);
    if (next === 'new') p.delete('status');
    else p.set('status', next);
    setParams(p, { replace: true });
  };

  const mark = async (msg, next) => {
    setBusy(true);
    try {
      await api.patch(`/support/${msg._id}`, { status: next });
      toast.success(next === 'handled' ? t('dash.support.marked') : t('dash.support.reopened'));
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
      await api.delete(`/support/${toDelete._id}`);
      toast.success(t('dash.support.deleted'));
      setToDelete(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('auth.errors.generic'));
    } finally {
      setBusy(false);
    }
  };

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const statusOptions = [
    { value: 'new', label: t('dash.support.filterNew') },
    { value: 'handled', label: t('dash.support.filterHandled') },
    { value: 'all', label: t('dash.support.filterAll') },
  ];

  return (
    <div>
      <PageHeader title={t('dash.nav.support')} />

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="w-full sm:w-56">
          <Select
            aria-label={t('dash.support.filterLabel')}
            options={statusOptions}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />
        </div>
        {meta && (
          <p className="text-body text-ink/60">
            {t('dash.support.count', { count: meta.total })}
          </p>
        )}
      </div>

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2">
          {[0, 1].map((i) => <Skeleton key={i} className="h-40 rounded-card" />)}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          title={t('dash.support.empty')}
          description={t('dash.support.emptyHint')}
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {rows.map((m) => (
            <Card key={m._id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="min-w-0 break-words text-h3 text-ink">{m.email}</h3>
                <Badge tone={m.status === 'handled' ? 'primary' : 'amber'}>
                  {m.status === 'handled' ? t('dash.support.handled') : t('dash.support.new')}
                </Badge>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <FieldRow
                  icon={Mail}
                  label={t('dash.common.date')}
                  value={formatDate(m.createdAt, i18n.language)}
                />
                <FieldRow
                  icon={User}
                  label={t('dash.support.sender')}
                  value={
                    m.userId
                      ? `${m.userId.firstName} ${m.userId.lastName} (${m.userId.role})`
                      : t('dash.support.anonymous')
                  }
                />
              </div>

              <p className="mt-3 whitespace-pre-wrap rounded-card bg-black/[0.03] p-3 text-small text-ink/75">
                {m.message}
              </p>

              {m.status === 'handled' && m.handledBy && (
                <p className="mt-2 text-small text-ink/50">
                  {t('dash.support.handledBy', {
                    name: `${m.handledBy.firstName} ${m.handledBy.lastName}`,
                    date: formatDate(m.handledAt, i18n.language),
                  })}
                </p>
              )}

              <div className="mt-4 flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setToDelete(m)}>
                  <Trash2 size={16} className="text-red-500" /> {t('common.delete')}
                </Button>
                {m.status === 'handled' ? (
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => mark(m, 'new')}>
                    <Undo2 size={16} /> {t('dash.support.reopen')}
                  </Button>
                ) : (
                  <Button size="sm" variant="brand" disabled={busy} onClick={() => mark(m, 'handled')}>
                    <Check size={16} /> {t('dash.support.markHandled')}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        loading={busy}
        confirmLabel={t('common.delete')}
        title={t('dash.support.deleteTitle')}
        message={toDelete ? t('dash.support.deleteConfirm', { email: toDelete.email }) : ''}
      />
    </div>
  );
}
