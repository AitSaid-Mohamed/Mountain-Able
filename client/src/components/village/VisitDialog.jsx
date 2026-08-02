import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';
import { Modal, Button, Input } from '../ui/index.js';
import { useMe } from '../../context/MeContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

const toDateInput = (d) =>
  (d ? new Date(d) : new Date()).toISOString().slice(0, 10);

/**
 * Dialog to declare or edit a village visit (date + optional note). Shared by
 * the public detail controls and the /my journey timeline. When `record` is
 * given it edits (with a Remove action); otherwise it creates.
 */
export default function VisitDialog({ village, record, onClose }) {
  const { t } = useTranslation();
  const me = useMe();
  const toast = useToast();
  const [visitedAt, setVisitedAt] = useState(toDateInput(record?.visitedAt));
  const [note, setNote] = useState(record?.note ?? '');
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (record) {
        await me.updateVisited(record._id, { visitedAt, note });
      } else {
        await me.addVisited(village, { visitedAt, note });
        toast.success(t('village.visitSaved'));
      }
      onClose();
    } catch {
      /* MeContext surfaces the error and rolls back */
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    await me.removeVisited(record._id);
    setBusy(false);
    onClose();
  };

  return (
    <Modal open onClose={onClose} size="sm" title={t('village.visitDialogTitle')}>
      <form className="p-6" onSubmit={save}>
        <h3 className="text-h3 text-ink">{t('village.visitDialogTitle')}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-small text-ink/50">
          <Info size={14} aria-hidden="true" /> {t('village.visitDialogHint')}
        </p>
        <div className="mt-4 space-y-4">
          <Input type="date" label={t('village.visitDate')} value={visitedAt} onChange={(e) => setVisitedAt(e.target.value)} required />
          <div>
            <label htmlFor="visit-note" className="mb-1.5 block text-small font-medium text-ink">
              {t('village.visitNote')}
            </label>
            <textarea
              id="visit-note"
              rows={3}
              maxLength={280}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('village.visitNotePlaceholder')}
              className="w-full rounded-card bg-white px-4 py-3 text-body shadow-input placeholder:text-[#757575] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between gap-3">
          {record ? (
            <Button type="button" variant="ghost" onClick={remove} disabled={busy} className="!text-red-500">
              {t('my.removeVisit')}
            </Button>
          ) : <span />}
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>{t('common.cancel')}</Button>
            <Button type="submit" variant="brand" loading={busy}>{t('village.saveVisit')}</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
