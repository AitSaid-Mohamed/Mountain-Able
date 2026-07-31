import { useTranslation } from 'react-i18next';
import { Compass, Users, ShieldCheck } from 'lucide-react';
import Container from '../components/layout/Container.jsx';
import { Card } from '../components/ui/index.js';

export default function AboutPage() {
  const { t } = useTranslation();
  const blocks = [
    { icon: Compass, title: t('about.mission'), body: t('about.missionBody') },
    { icon: Users, title: t('about.whatWeDo'), body: t('about.whatWeDoBody') },
    { icon: ShieldCheck, title: t('about.scope'), body: t('about.scopeBody') },
  ];

  return (
    <Container className="py-14">
      <h1 className="text-display text-ink">
        {t('about.title')}
      </h1>
      <p className="mt-3 max-w-2xl text-body-lg text-ink/70">{t('about.lead')}</p>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {blocks.map((b) => (
          <Card key={b.title} className="p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-card bg-primary/10 text-primary">
              <b.icon size={24} aria-hidden="true" />
            </div>
            <h2 className="text-h3 text-ink">{b.title}</h2>
            <p className="mt-2 text-body text-ink/70">{b.body}</p>
          </Card>
        ))}
      </div>
    </Container>
  );
}
