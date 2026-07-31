import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from './Button.jsx';
import { cn } from '../../lib/utils.js';

/** Error block with a retry action, used by list/detail views on fetch failure. */
export default function ErrorState({ onRetry, message, className }) {
  const { t } = useTranslation();
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500">
        <AlertTriangle size={28} aria-hidden="true" />
      </div>
      <h3 className="text-h3 text-ink">{t('common.error')}</h3>
      <p className="mt-2 max-w-md text-body text-ink/60">{message ?? t('common.errorLoading')}</p>
      {onRetry && (
        <Button variant="outline" className="mt-6" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      )}
    </div>
  );
}
