import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button, Input, Select, Modal, ConfirmDialog, Spinner, EmptyState } from '../ui/index.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import api from '../../lib/api.js';

/**
 * CRUD manager for a village's attractions. Reused by the village editor's
 * Attractions tab and the officer's standalone Attractions page.
 */
export default function AttractionManager({ villageId, categories = [], readOnly }) {
  const { t } = useTranslation();
  const toast = useToast();
  const { data, loading, refetch } = useFetch(villageId ? `/villages/${villageId}/attractions` : null, {
    deps: [villageId],
  });
  const [editing, setEditing] = useState(null); // attraction | 'new' | null
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const items = data ?? [];

  const save = async (form) => {
    setBusy(true);
    try {
      if (editing === 'new') {
        await api.post(`/villages/${villageId}/attractions`, form);
      } else {
        await api.patch(`/attractions/${editing._id}`, form);
      }
      toast.success(t('profile.saved'));
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
      await api.delete(`/attractions/${toDelete._id}`);
      toast.success(t('common.delete'));
      setToDelete(null);
      refetch();
    } catch {
      toast.error(t('auth.errors.generic'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button size="sm" variant="brand" disabled={readOnly || !villageId} onClick={() => setEditing('new')}>
          <Plus size={16} /> {t('dash.officer.addAttraction')}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8 text-ink/40"><Spinner size={22} /></div>
      ) : items.length === 0 ? (
        <EmptyState title={t('village.noAttractions')} />
      ) : (
        <ul className="divide-y divide-ink/5">
          {items.map((a) => (
            <li key={a._id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{a.name}</p>
                <p className="truncate text-small text-ink/50">{a.categoryId?.name}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button size="sm" variant="ghost" disabled={readOnly} onClick={() => setEditing(a)}><Pencil size={15} /></Button>
                <Button size="sm" variant="ghost" disabled={readOnly} onClick={() => setToDelete(a)}><Trash2 size={15} className="text-red-500" /></Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <AttractionForm
          open
          onClose={() => setEditing(null)}
          initial={editing === 'new' ? null : editing}
          categories={categories}
          onSave={save}
          busy={busy}
        />
      )}
      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        loading={busy}
        message={toDelete ? `${t('common.delete')} “${toDelete.name}”?` : ''}
      />
    </div>
  );
}

function AttractionForm({ open, onClose, initial, categories, onSave, busy }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    categoryId: initial?.categoryId?._id ?? initial?.categoryId ?? categories[0]?._id ?? '',
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Modal open={open} onClose={onClose} size="md" title={t('dash.officer.addAttraction')}>
      <form
        className="space-y-4 p-6"
        onSubmit={(e) => { e.preventDefault(); onSave(form); }}
      >
        <Input label={t('dash.common.name')} value={form.name} onChange={set('name')} required />
        <Select
          label={t('dash.officer.category')}
          value={form.categoryId}
          onChange={set('categoryId')}
          options={categories.map((c) => ({ value: c._id, label: c.name }))}
          required
        />
        <div>
          <label className="mb-1.5 block text-small font-medium text-ink">{t('dash.officer.description')}</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={set('description')}
            className="w-full rounded-card bg-white px-4 py-3 text-body shadow-input focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" variant="brand" loading={busy}>{t('common.save')}</Button>
        </div>
      </form>
    </Modal>
  );
}
