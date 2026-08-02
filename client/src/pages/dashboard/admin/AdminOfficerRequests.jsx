import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlus, Building2, MapPin, Check, X, Mail } from 'lucide-react';
import { PageHeader, Panel, FieldRow } from '../../../components/dashboard/index.js';
import { Card, Button, Badge, Modal, ConfirmDialog, Skeleton, EmptyState, ErrorState } from '../../../components/ui/index.js';
import { useFetch } from '../../../hooks/useFetch.js';
import { useToast } from '../../../context/ToastContext.jsx';
import api from '../../../lib/api.js';
import { formatDate } from '../../../lib/utils.js';

export default function AdminOfficerRequests() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const { data, loading, error, refetch } = useFetch('/officer-requests', { params: { status: 'pending', limit: 50 } });
  const [approve, setApprove] = useState(null);
  const [reject, setReject] = useState(null);
  const [busy, setBusy] = useState(false);
  const rows = data ?? [];

  const act = async (req, status, done) => {
    setBusy(true);
    try {
      await api.patch(`/officer-requests/${req._id}`, { status });
      toast.success(status === 'approved' ? t('dash.common.approved') : t('dash.common.rejected'));
      done();
      refetch();
    } catch (err) { toast.error(err.response?.data?.message ?? t('auth.errors.generic')); }
    finally { setBusy(false); }
  };

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div>
      <PageHeader title={t('dash.nav.requests')} />

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2">{[0, 1].map((i) => <Skeleton key={i} className="h-48 rounded-card" />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState icon={UserPlus} title={t('dash.admin.noRequests')} />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {rows.map((r) => (
            <Card key={r._id} className="flex flex-col p-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-h3 text-ink">{r.requesterName}</h3>
                <Badge tone="amber">{t('dash.common.pending')}</Badge>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <FieldRow icon={Mail} label={t('dash.common.email')} value={r.email} />
                <FieldRow icon={Building2} label={t('dash.common.municipality')} value={r.municipalityName} />
                <FieldRow icon={MapPin} label={t('dash.common.region')} value={r.region} />
                <FieldRow icon={MapPin} label={t('dash.common.date')} value={formatDate(r.createdAt, i18n.language)} />
              </div>
              {r.message && <p className="mt-3 rounded-card bg-black/[0.03] p-3 text-small text-ink/70">“{r.message}”</p>}
              <div className="mt-4 flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setReject(r)}><X size={16} className="text-red-500" /> {t('dash.common.reject')}</Button>
                <Button size="sm" variant="brand" onClick={() => setApprove(r)}><Check size={16} /> {t('dash.common.approve')}</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Approve — confirm municipality details before activating */}
      <Modal open={Boolean(approve)} onClose={() => setApprove(null)} size="sm" title={t('dash.admin.approveRequest')}>
        {approve && (
          <div className="p-6">
            <h3 className="text-h3 text-ink">{t('dash.admin.approveRequest')}</h3>
            <p className="mt-2 text-body text-ink/70">{t('dash.admin.approveConfirm')}</p>
            <div className="mt-4 space-y-2 rounded-card bg-black/[0.03] p-4 text-small">
              <p><b>{approve.requesterName}</b> · {approve.email}</p>
              <p>{approve.municipalityName} — {approve.region}{approve.province ? `, ${approve.province}` : ''}</p>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setApprove(null)}>{t('common.cancel')}</Button>
              <Button variant="brand" loading={busy} onClick={() => act(approve, 'approved', () => setApprove(null))}>{t('dash.common.approve')}</Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={Boolean(reject)} onClose={() => setReject(null)} onConfirm={() => act(reject, 'rejected', () => setReject(null))}
        loading={busy} confirmLabel={t('dash.common.reject')} title={t('dash.admin.rejectRequest')}
        message={reject ? `${t('dash.common.reject')} ${reject.requesterName}?` : ''} />
    </div>
  );
}
