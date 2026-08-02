import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserCog, UserCheck, UserX, Trash2 } from 'lucide-react';
import { PageHeader, RowActions } from '../../../components/dashboard/index.js';
import { DataTable, Select, Badge, Modal, Button, ConfirmDialog } from '../../../components/ui/index.js';
import { useFetch } from '../../../hooks/useFetch.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import api from '../../../lib/api.js';
import { mediaUrl, formatDate } from '../../../lib/utils.js';

const ROLE_TONE = { admin: 'amber', officer: 'primary', authority: 'neutral', tourist: 'neutral' };
const STATUS_TONE = { active: 'primary', pending: 'amber', suspended: 'neutral' };

export default function AdminUsers() {
  const { t, i18n } = useTranslation();
  const { user: me } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const role = params.get('role') ?? '';
  const status = params.get('status') ?? '';
  const page = Math.max(1, parseInt(params.get('page') ?? '1', 10) || 1);
  const [roleEdit, setRoleEdit] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const { data, meta, loading, error, refetch } = useFetch('/users', {
    params: { page, limit: 10, ...(role && { role }), ...(status && { status }) },
  });
  const rows = data ?? [];

  const setParam = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v == null || v === '' ? next.delete(k) : next.set(k, v)));
    setParams(next, { replace: true });
  };

  const setStatus = async (u, s) => {
    try {
      await api.patch(`/users/${u._id}/status`, { status: s });
      toast.success(t('profile.saved'));
      refetch();
    } catch (err) { toast.error(err.response?.data?.message ?? t('auth.errors.generic')); }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/users/${toDelete._id}`);
      toast.success(t('common.delete'));
      setToDelete(null);
      refetch();
    } catch (err) { toast.error(err.response?.data?.message ?? t('auth.errors.generic')); setToDelete(null); }
    finally { setBusy(false); }
  };

  const columns = [
    {
      key: 'name', header: t('dash.common.name'),
      render: (u) => (
        <div className="flex items-center gap-3">
          {u.avatar ? <img src={mediaUrl(u.avatar)} alt="" className="h-8 w-8 rounded-full object-cover" />
            : <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">{(u.firstName?.[0] ?? '') + (u.lastName?.[0] ?? '')}</span>}
          <span className="font-medium text-ink">{u.firstName} {u.lastName}{me._id === u._id && <span className="ml-1 text-small text-ink/40">({t('nav.myProfile')})</span>}</span>
        </div>
      ),
    },
    { key: 'email', header: t('dash.common.email'), render: (u) => <span className="text-small text-ink/70">{u.email}</span> },
    { key: 'role', header: t('dash.common.role'), render: (u) => <Badge tone={ROLE_TONE[u.role]}>{t(`roles.${u.role}`)}</Badge> },
    { key: 'status', header: t('dash.common.status'), render: (u) => <Badge tone={STATUS_TONE[u.status]}>{t(`dash.common.${u.status}`)}</Badge> },
    { key: 'createdAt', header: t('dash.common.joined'), cardHidden: true, render: (u) => <span className="text-small text-ink/60">{formatDate(u.createdAt, i18n.language)}</span> },
    {
      key: 'actions', header: '', className: 'text-right',
      render: (u) => {
        const self = me._id === u._id;
        return (
          <RowActions items={[
            { label: t('dash.admin.changeRole'), icon: UserCog, disabled: self, onClick: () => setRoleEdit(u) },
            u.status !== 'active' && { label: t('dash.common.active'), icon: UserCheck, disabled: self, onClick: () => setStatus(u, 'active') },
            u.status !== 'suspended' && { label: t('dash.common.suspended'), icon: UserX, disabled: self, onClick: () => setStatus(u, 'suspended') },
            { label: t('common.delete'), icon: Trash2, danger: true, disabled: self, onClick: () => setToDelete(u) },
          ]} />
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader title={t('dash.nav.users')} />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="w-full sm:w-44">
          <Select value={role} onChange={(e) => setParam({ role: e.target.value, page: null })} options={[
            { value: '', label: t('dash.common.all') }, { value: 'tourist', label: t('roles.tourist') },
            { value: 'officer', label: t('roles.officer') }, { value: 'admin', label: t('roles.admin') }, { value: 'authority', label: t('roles.authority') },
          ]} />
        </div>
        <div className="w-full sm:w-44">
          <Select value={status} onChange={(e) => setParam({ status: e.target.value, page: null })} options={[
            { value: '', label: t('dash.common.all') }, { value: 'active', label: t('dash.common.active') },
            { value: 'pending', label: t('dash.common.pending') }, { value: 'suspended', label: t('dash.common.suspended') },
          ]} />
        </div>
      </div>

      <DataTable columns={columns} rows={rows} loading={loading} error={error} onRetry={refetch}
        page={page} totalPages={meta?.totalPages ?? 1} onPageChange={(p) => setParam({ page: p === 1 ? null : String(p) })} />

      {roleEdit && <RoleModal open onClose={() => setRoleEdit(null)} user={roleEdit} onDone={() => { setRoleEdit(null); refetch(); }} />}
      <ConfirmDialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} onConfirm={remove} loading={busy}
        message={toDelete ? `${t('common.delete')} ${toDelete.firstName} ${toDelete.lastName}?` : ''} />
    </div>
  );
}

function RoleModal({ open, onClose, user, onDone }) {
  const { t } = useTranslation();
  const toast = useToast();
  const { data: munis } = useFetch('/municipalities');
  const [role, setRole] = useState(user.role);
  const [muni, setMuni] = useState(user.municipalityId?._id ?? user.municipalityId ?? '');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await api.patch(`/users/${user._id}/role`, { role, ...(role === 'officer' && { municipalityId: muni }) });
      toast.success(t('profile.saved'));
      onDone();
    } catch (err) { toast.error(err.response?.data?.message ?? t('auth.errors.generic')); }
    finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} size="sm" title={t('dash.admin.changeRole')}>
      <div className="space-y-4 p-6">
        <h3 className="text-h3 text-ink">{t('dash.admin.changeRole')}</h3>
        <Select label={t('dash.common.role')} value={role} onChange={(e) => setRole(e.target.value)} options={[
          { value: 'tourist', label: t('roles.tourist') }, { value: 'officer', label: t('roles.officer') },
          { value: 'admin', label: t('roles.admin') }, { value: 'authority', label: t('roles.authority') },
        ]} />
        {role === 'officer' && (
          <Select label={t('dash.common.municipality')} value={muni} onChange={(e) => setMuni(e.target.value)}
            placeholder="—" options={(munis ?? []).map((m) => ({ value: m._id, label: m.name }))} required />
        )}
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="brand" loading={busy} disabled={role === 'officer' && !muni} onClick={save}>{t('common.save')}</Button>
        </div>
      </div>
    </Modal>
  );
}
