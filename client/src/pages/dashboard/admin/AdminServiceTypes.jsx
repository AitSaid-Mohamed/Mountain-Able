import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, EyeOff, Eye } from 'lucide-react';
import { PageHeader, RowActions } from '../../../components/dashboard/index.js';
import {
  DataTable, Input, Select, Button, Badge, Modal, ConfirmDialog, ErrorState,
} from '../../../components/ui/index.js';
import ServiceIcon from '../../../components/coordination/ServiceIcon.jsx';
import { useFetch } from '../../../hooks/useFetch.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { invalidate } from '../../../lib/requestCache.js';
import api from '../../../lib/api.js';

const GROUPS = ['mobility', 'expertise', 'facilities', 'supply', 'emergency'];

const ICON_CHOICES = [
  'Bus', 'Accessibility', 'Zap', 'Snowflake', 'Mountain', 'Landmark', 'Languages',
  'BedDouble', 'Presentation', 'Backpack', 'SquareParking', 'Wheat', 'Hammer',
  'HeartPulse', 'LifeBuoy', 'Truck', 'Users', 'Wrench', 'Tent', 'Compass',
];

/**
 * The coordination taxonomy.
 *
 * A fixed vocabulary is what makes the regional authority's analytics possible —
 * free text does not aggregate — so this is the one place it can change, and
 * only an administrator can change it.
 */
export default function AdminServiceTypes() {
  const { t } = useTranslation();
  const toast = useToast();
  const { data, loading, error, refetch } = useFetch('/service-types', {
    params: { includeInactive: 'true' },
  });
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const rows = data ?? [];

  const refresh = () => {
    invalidate('/service-types');
    refetch();
  };

  const save = async (form) => {
    setBusy(true);
    try {
      if (editing === 'new') await api.post('/service-types', form);
      else await api.patch(`/service-types/${editing._id}`, form);
      toast.success(t('profile.saved'));
      setEditing(null);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('auth.errors.generic'));
    } finally { setBusy(false); }
  };

  const toggleActive = async (row) => {
    setBusy(true);
    try {
      await api.patch(`/service-types/${row._id}`, { isActive: !row.isActive });
      toast.success(row.isActive ? t('coord.admin.retired') : t('coord.admin.restored'));
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('auth.errors.generic'));
    } finally { setBusy(false); }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/service-types/${toDelete._id}`);
      toast.success(t('common.delete'));
      setToDelete(null);
      refresh();
    } catch (err) {
      // A 409 here is the in-use guard: deleting a type that municipalities have
      // declared would orphan the historical record the analytics rest on.
      toast.error(err.response?.data?.message ?? t('auth.errors.generic'));
      setToDelete(null);
    } finally { setBusy(false); }
  };

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const columns = [
    {
      key: 'icon', header: t('dash.admin.icon'), className: 'w-16',
      render: (s) => (
        <span className="flex h-9 w-9 items-center justify-center rounded-card bg-primary/10 text-primary">
          <ServiceIcon name={s.icon} size={18} />
        </span>
      ),
    },
    {
      key: 'name', header: t('dash.common.name'), sortable: true,
      render: (s) => (
        <span>
          <span className="font-medium text-ink">{s.name}</span>
          {!s.isActive && <Badge tone="neutral" className="ml-2">{t('coord.admin.retiredBadge')}</Badge>}
          <span className="block text-small text-ink/55">{s.description}</span>
        </span>
      ),
    },
    {
      key: 'group', header: t('coord.admin.group'), sortable: true,
      render: (s) => <span className="text-small text-ink/70">{t(`coord.group.${s.group}`)}</span>,
    },
    { key: 'slug', header: 'Slug', render: (s) => <span className="text-small text-ink/50">{s.slug}</span> },
    {
      key: 'actions', header: '', className: 'w-12',
      render: (s) => (
        <RowActions
          items={[
            { label: t('common.edit'), icon: Pencil, onClick: () => setEditing(s) },
            {
              label: s.isActive ? t('coord.admin.retire') : t('coord.admin.restore'),
              icon: s.isActive ? EyeOff : Eye,
              onClick: () => toggleActive(s),
            },
            { label: t('common.delete'), icon: Trash2, danger: true, onClick: () => setToDelete(s) },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('dash.nav.serviceTypes')}
        action={
          <Button variant="brand" onClick={() => setEditing('new')}>
            <Plus size={16} /> {t('coord.admin.addType')}
          </Button>
        }
      />
      <p className="-mt-2 mb-6 max-w-3xl text-body text-ink/70">{t('coord.admin.intro')}</p>

      <DataTable columns={columns} rows={rows} loading={loading} rowKey={(s) => s._id} />

      <TypeDialog editing={editing} busy={busy} onClose={() => setEditing(null)} onSave={save} />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        loading={busy}
        confirmLabel={t('common.delete')}
        title={t('coord.admin.deleteTitle')}
        message={toDelete ? t('coord.admin.deleteConfirm', { name: toDelete.name }) : ''}
      />
    </div>
  );
}

function TypeDialog({ editing, busy, onClose, onSave }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(null);
  const isNew = editing === 'new';

  const current = form ?? {
    name: isNew ? '' : editing?.name ?? '',
    description: isNew ? '' : editing?.description ?? '',
    icon: isNew ? 'Sparkles' : editing?.icon ?? 'Sparkles',
    group: isNew ? 'mobility' : editing?.group ?? 'mobility',
    sortOrder: isNew ? 0 : editing?.sortOrder ?? 0,
  };
  const set = (k) => (e) => setForm({ ...current, [k]: e.target.value });

  const close = () => { setForm(null); onClose(); };

  return (
    <Modal open={Boolean(editing)} onClose={close} size="sm"
      title={isNew ? t('coord.admin.addType') : t('common.edit')}>
      {editing && (
        <div className="p-6">
          <h3 className="text-h3 text-ink">{isNew ? t('coord.admin.addType') : editing.name}</h3>
          <div className="mt-4 space-y-4">
            <Input label={t('dash.common.name')} required value={current.name} onChange={set('name')} />
            <Input label={t('coord.admin.description')} value={current.description} onChange={set('description')} />
            <Select label={t('coord.admin.group')} value={current.group} onChange={set('group')}
              options={GROUPS.map((g) => ({ value: g, label: t(`coord.group.${g}`) }))} />
            <Input type="number" label={t('coord.admin.sortOrder')} value={current.sortOrder} onChange={set('sortOrder')} />
            <div>
              <p className="mb-1.5 text-small font-medium text-ink">{t('dash.admin.icon')}</p>
              <div className="flex flex-wrap gap-2">
                {ICON_CHOICES.map((name) => (
                  <button key={name} type="button" onClick={() => setForm({ ...current, icon: name })}
                    title={name}
                    className={`flex h-9 w-9 items-center justify-center rounded-card transition ${
                      current.icon === name ? 'bg-primary text-white' : 'bg-black/5 text-ink/60 hover:bg-black/10'
                    }`}>
                    <ServiceIcon name={name} size={17} />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={close}>{t('common.cancel')}</Button>
            <Button variant="brand" loading={busy} onClick={() => onSave(current)}>{t('common.save')}</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
