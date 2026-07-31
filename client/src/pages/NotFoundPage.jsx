import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { MountainSnow } from 'lucide-react';
import Container from '../components/layout/Container.jsx';
import { Button } from '../components/ui/index.js';

export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <MountainSnow size={64} className="text-primary" aria-hidden="true" />
      <p className="mt-4 text-display text-primary">404</p>
      <h1 className="mt-2 text-h1 text-ink">{t('notFound.title')}</h1>
      <p className="mt-2 max-w-md text-body text-ink/60">{t('notFound.subtitle')}</p>
      <Button as={Link} to="/" variant="brand" className="mt-8">
        {t('notFound.cta')}
      </Button>
    </Container>
  );
}
