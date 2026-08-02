import { AlertTriangle, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from './Button.jsx';
import { isNetworkError } from '../../lib/api.js';
import { cn } from '../../lib/utils.js';

/**
 * Error block with a retry action. Distinguishes the two causes, which are
 * different problems for the user:
 *  - network error (no HTTP response) → "couldn't reach the server"
 *  - HTTP error response → "the server returned an error"
 * Pass the caught `error` so it can classify; `message` overrides the copy.
 */
export default function ErrorState({ error, onRetry, message, className }) {
  const { t } = useTranslation();
  const network = isNetworkError(error);
  const Icon = network ? WifiOff : AlertTriangle;

  const title = network ? t('common.connectionError') : t('common.serverError');
  const body = message ?? (network ? t('common.connectionErrorHint') : t('common.serverErrorHint'));

  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div
        className={cn(
          'mb-4 flex h-16 w-16 items-center justify-center rounded-full',
          network ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-500'
        )}
      >
        <Icon size={28} aria-hidden="true" />
      </div>
      <h3 className="text-h3 text-ink">{title}</h3>
      <p className="mt-2 max-w-md text-body text-ink/60">{body}</p>
      {onRetry && (
        <Button variant="outline" className="mt-6" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      )}
    </div>
  );
}
