import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button, Input, Modal, ConfirmDialog, Spinner, EmptyState } from '../ui/index.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import api from '../../lib/api.js';
import { formatDate } from '../../lib/utils.js';

const isoDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

/** CRUD manager for a village's events. Validates endDate >= startDate. */
export default function EventManager({ villageId, readOnly }) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const { data, loading, refetch } = useFetch(villageId ? `/villages/${villageId}/events` : null, {
    deps: [villageId],
  });
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const items = data ?? [];

  const save = async (form) => {
    setBusy(true);
    try {
      if (editing === 'new') await api.post(`/villages/${villageId}/events`, form);
      else await api.patch(`/events/${editing._id}`, form);
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
      await api.delete(`/events/${toDelete._id}`);
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
          <Plus size={16} /> {t('dash.officer.addEvent')}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8 text-ink/40"><Spinner size={22} /></div>
      ) : items.length === 0 ? (
        <EmptyState title={t('village.noEvents')} />
      ) : (
        <ul className="divide-y divide-ink/5">
          {items.map((ev) => (
            <li key={ev._id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{ev.title}</p>
                <p className="truncate text-small text-ink/50">
                  {formatDate(ev.startDate, i18n.language)} – {formatDate(ev.endDate, i18n.language)}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button size="sm" variant="ghost" disabled={readOnly} onClick={() => setEditing(ev)}><Pencil size={15} /></Button>
                <Button size="sm" variant="ghost" disabled={readOnly} onClick={() => setToDelete(ev)}><Trash2 size={15} className="text-red-500" /></Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <EventForm open onClose={() => setEditing(null)} initial={editing === 'new' ? null : editing} onSave={save} busy={busy} />
      )}
      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        loading={busy}
        message={toDelete ? `${t('common.delete')} “${toDelete.title}”?` : ''}
      />
    </div>
  );
}

function EventForm({ open, onClose, initial, onSave, busy }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    startDate: isoDate(initial?.startDate),
    endDate: isoDate(initial?.endDate),
  });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate) return setErr(t('village.ratingRequired'));
    if (new Date(form.endDate) < new Date(form.startDate)) {
      return setErr(t('dash.officer.endDate') + ' ≥ ' + t('dash.officer.startDate'));
    }
    setErr('');
    onSave(form);
  };

  return (
    <Modal open={open} onClose={onClose} size="md" title={t('dash.officer.addEvent')}>
      <form className="space-y-4 p-6" onSubmit={submit}>
        <Input label={t('dash.officer.title')} value={form.title} onChange={set('title')} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input type="date" label={t('dash.officer.startDate')} value={form.startDate} onChange={set('startDate')} required />
          <Input type="date" label={t('dash.officer.endDate')} value={form.endDate} onChange={set('endDate')} required />
        </div>
        <div>
          <label className="mb-1.5 block text-small font-medium text-ink">{t('dash.officer.description')}</label>
          <textarea rows={3} value={form.description} onChange={set('description')}
            className="w-full rounded-card bg-white px-4 py-3 text-body shadow-input focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" />
        </div>
        {err && <p className="text-small text-red-600">{err}</p>}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" variant="brand" loading={busy}>{t('common.save')}</Button>
        </div>
      </form>
    </Modal>
  );
}
