import { useTranslation } from 'react-i18next';
import Modal from './Modal.jsx';
import Button from './Button.jsx';

/**
 * Confirmation dialog for destructive actions. Wraps Modal with a title,
 * message and confirm/cancel buttons.
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  loading = false,
  danger = true,
}) {
  const { t } = useTranslation();
  return (
    <Modal open={open} onClose={onClose} size="sm" title={title}>
      <div className="p-6">
        <h3 className="text-h3 text-ink">{title ?? t('dashboard.confirmTitle')}</h3>
        <p className="mt-2 text-body text-ink/70">{message ?? t('dashboard.confirmDelete')}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button
            variant={danger ? 'primary' : 'brand'}
            onClick={onConfirm}
            loading={loading}
            className={danger ? '!bg-red-500' : undefined}
          >
            {confirmLabel ?? t('common.delete')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
