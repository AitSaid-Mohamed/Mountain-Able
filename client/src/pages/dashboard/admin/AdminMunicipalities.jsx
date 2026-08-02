import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Download } from 'lucide-react';
import { PageHeader, RowActions } from '../../../components/dashboard/index.js';
import { DataTable, Input, Button, Modal, ConfirmDialog } from '../../../components/ui/index.js';
import { useFetch } from '../../../hooks/useFetch.js';
import { useToast } from '../../../context/ToastContext.jsx';
import api from '../../../lib/api.js';
import { exportCsv } from '../../../lib/csv.js';

export default function AdminMunicipalities() {
  const { t } = useTranslation();
  const toast = useToast();
  const { data: munis, loading, error, refetch } = useFetch('/municipalities');
  const { data: villages } = useFetch('/villages', { params: { includeUnpublished: 'true', limit: 50 } });
  const { data: officers } = useFetch('/users', { params: { role: 'officer', limit: 100 } });
  const [editing, setEditing] = useState(null); // muni | 'new' | null
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const midOf = (x) => x.municipalityId?._id ?? x.municipalityId;
    return (munis ?? []).map((m) => ({
      ...m,
      villageCount: (villages ?? []).filter((v) => midOf(v) === m._id).length,
      officerCount: (officers ?? []).filter((o) => midOf(o) === m._id).length,
    }));
  }, [munis, villages, officers]);

  const save = async (form) => {
    setBusy(true);
    try {
      if (editing === 'new') await api.post('/municipalities', form);
      else await api.patch(`/municipalities/${editing._id}`, form);
      toast.success(t('profile.saved'));
      setEditing(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('auth.errors.generic'));
    } finally { setBusy(false); }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/municipalities/${toDelete._id}`);
      toast.success(t('common.delete'));
      setToDelete(null);
      refetch();
    } catch (err) {
      // Surface the API's 409 (villages still reference it) as a clear message.
      toast.error(err.response?.data?.message ?? t('auth.errors.generic'));
      setToDelete(null);
    } finally { setBusy(false); }
  };

  const columns = [
    { key: 'name', header: t('dash.common.name'), sortable: true, render: (m) => <span className="font-medium text-ink">{m.name}</span> },
    { key: 'region', header: t('dash.common.region'), sortable: true },
    { key: 'province', header: t('dash.common.province') },
    { key: 'officerCount', header: t('dash.admin.officerCount'), sortable: true, className: 'text-center' },
    { key: 'villageCount', header: t('dash.admin.villageCount'), sortable: true, className: 'text-center' },
    { key: 'contactEmail', header: t('dash.common.contact'), render: (m) => <span className="text-small text-ink/60">{m.contactEmail || '—'}</span> },
    {
      key: 'actions', header: '', className: 'text-right',
      render: (m) => (
        <RowActions items={[
          { label: t('common.edit'), icon: Pencil, onClick: () => setEditing(m) },
          { label: t('common.delete'), icon: Trash2, danger: true, onClick: () => setToDelete(m) },
        ]} />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('dash.nav.municipalities')}
        actions={
          <>
            <Button variant="outline" onClick={() => exportCsv('municipalities', [
              { key: 'name', header: 'Name' }, { key: 'region', header: 'Region' }, { key: 'province', header: 'Province' },
              { key: 'officerCount', header: 'Officers' }, { key: 'villageCount', header: 'Villages' }, { key: 'contactEmail', header: 'Contact' },
            ], rows)}><Download size={16} /> {t('dash.common.exportCsv')}</Button>
            <Button variant="brand" onClick={() => setEditing('new')}><Plus size={18} /> {t('dash.admin.newMunicipality')}</Button>
          </>
        }
      />

      <DataTable columns={columns} rows={rows} loading={loading} error={error} onRetry={refetch} pageSize={10} />

      {editing && <MuniForm open onClose={() => setEditing(null)} initial={editing === 'new' ? null : editing} onSave={save} busy={busy} />}
      <ConfirmDialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} onConfirm={remove} loading={busy}
        message={toDelete ? `${t('common.delete')} “${toDelete.name}”?` : ''} />
    </div>
  );
}

function MuniForm({ open, onClose, initial, onSave, busy }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: initial?.name ?? '', region: initial?.region ?? '', province: initial?.province ?? '',
    contactEmail: initial?.contactEmail ?? '', phone: initial?.phone ?? '',
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Modal open={open} onClose={onClose} size="md" title={initial ? t('dash.admin.editMunicipality') : t('dash.admin.newMunicipality')}>
      <form className="space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
        <h2 className="text-h3 text-ink">{initial ? t('dash.admin.editMunicipality') : t('dash.admin.newMunicipality')}</h2>
        <Input label={t('dash.common.name')} value={form.name} onChange={set('name')} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label={t('dash.common.region')} value={form.region} onChange={set('region')} required />
          <Input label={t('dash.common.province')} value={form.province} onChange={set('province')} required />
          <Input type="email" label={t('dash.common.contact')} value={form.contactEmail} onChange={set('contactEmail')} />
          <Input label={t('profile.phone')} value={form.phone} onChange={set('phone')} />
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" variant="brand" loading={busy}>{t('common.save')}</Button>
        </div>
      </form>
    </Modal>
  );
}
