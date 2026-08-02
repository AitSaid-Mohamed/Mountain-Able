import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as Icons from 'lucide-react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { PageHeader, RowActions } from '../../../components/dashboard/index.js';
import { DataTable, Input, Button, Modal, ConfirmDialog } from '../../../components/ui/index.js';
import { useFetch } from '../../../hooks/useFetch.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { cn } from '../../../lib/utils.js';
import api from '../../../lib/api.js';

const ICON_CHOICES = [
  'Trees', 'Landmark', 'Wine', 'Footprints', 'Snowflake', 'Church', 'Building2', 'Hammer',
  'Mountain', 'Tent', 'Bike', 'Camera', 'Utensils', 'Music', 'Palette', 'Waves',
  'Trophy', 'Flower2', 'Grape', 'Fish', 'Bird', 'Compass', 'MapPin', 'Star',
];

function LucideIcon({ name, ...props }) {
  const Cmp = Icons[name] ?? Icons.Sparkles;
  return <Cmp {...props} />;
}

export default function AdminCategories() {
  const { t } = useTranslation();
  const toast = useToast();
  const { data, loading, error, refetch } = useFetch('/categories');
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const rows = data ?? [];

  const save = async (form) => {
    setBusy(true);
    try {
      if (editing === 'new') await api.post('/categories', form);
      else await api.patch(`/categories/${editing._id}`, form);
      toast.success(t('profile.saved'));
      setEditing(null);
      refetch();
    } catch (err) { toast.error(err.response?.data?.message ?? t('auth.errors.generic')); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/categories/${toDelete._id}`);
      toast.success(t('common.delete'));
      setToDelete(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('auth.errors.generic')); // 409 surfaced clearly
      setToDelete(null);
    } finally { setBusy(false); }
  };

  const columns = [
    { key: 'icon', header: t('dash.admin.icon'), className: 'w-16', render: (c) => <span className="flex h-9 w-9 items-center justify-center rounded-card bg-primary/10 text-primary"><LucideIcon name={c.icon} size={18} /></span> },
    { key: 'name', header: t('dash.common.name'), sortable: true, render: (c) => <span className="font-medium text-ink">{c.name}</span> },
    { key: 'slug', header: 'Slug', render: (c) => <span className="text-small text-ink/50">{c.slug}</span> },
    {
      key: 'actions', header: '', className: 'text-right',
      render: (c) => <RowActions items={[
        { label: t('common.edit'), icon: Pencil, onClick: () => setEditing(c) },
        { label: t('common.delete'), icon: Trash2, danger: true, onClick: () => setToDelete(c) },
      ]} />,
    },
  ];

  return (
    <div>
      <PageHeader title={t('dash.nav.categories')} actions={<Button variant="brand" onClick={() => setEditing('new')}><Plus size={18} /> {t('dash.admin.newCategory')}</Button>} />
      <DataTable columns={columns} rows={rows} loading={loading} error={error} onRetry={refetch} pageSize={12} />
      {editing && <CategoryForm open onClose={() => setEditing(null)} initial={editing === 'new' ? null : editing} onSave={save} busy={busy} />}
      <ConfirmDialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} onConfirm={remove} loading={busy}
        message={toDelete ? `${t('common.delete')} “${toDelete.name}”?` : ''} />
    </div>
  );
}

function CategoryForm({ open, onClose, initial, onSave, busy }) {
  const { t } = useTranslation();
  const [name, setName] = useState(initial?.name ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? ICON_CHOICES[0]);

  return (
    <Modal open={open} onClose={onClose} size="md" title={initial ? t('dash.admin.editCategory') : t('dash.admin.newCategory')}>
      <form className="space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); onSave({ name, icon }); }}>
        <h2 className="text-h3 text-ink">{initial ? t('dash.admin.editCategory') : t('dash.admin.newCategory')}</h2>
        <Input label={t('dash.common.name')} value={name} onChange={(e) => setName(e.target.value)} required />
        <div>
          <label className="mb-1.5 block text-small font-medium text-ink">{t('dash.admin.icon')}</label>
          <div className="grid grid-cols-8 gap-2">
            {ICON_CHOICES.map((n) => (
              <button key={n} type="button" onClick={() => setIcon(n)} title={n}
                className={cn('flex h-10 items-center justify-center rounded-card border transition', icon === n ? 'border-cta bg-cta/10 text-cta' : 'border-ink/10 text-ink/60 hover:border-ink/30')}>
                <LucideIcon name={n} size={18} />
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" variant="brand" loading={busy}>{t('common.save')}</Button>
        </div>
      </form>
    </Modal>
  );
}
