import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldX } from 'lucide-react';
import { Button } from '../components/ui/index.js';

/** 403 — shown when an authenticated user lacks the required role. */
export default function ForbiddenPage() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f9fcfb] p-6 text-center">
      <ShieldX size={64} className="text-red-500" aria-hidden="true" />
      <p className="mt-4 text-display text-ink">403</p>
      <h1 className="mt-2 text-h2 text-ink">{t('forbidden.title')}</h1>
      <p className="mt-2 max-w-md text-body text-ink/60">{t('forbidden.subtitle')}</p>
      <Button as={Link} to="/" variant="brand" className="mt-8">
        {t('common.backHome')}
      </Button>
    </div>
  );
}
