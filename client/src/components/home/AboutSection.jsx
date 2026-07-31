import { useTranslation } from 'react-i18next';
import Container from '../layout/Container.jsx';
import { onImageError } from '../../lib/utils.js';

const BAND_IMG =
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=70';
const ROW_IMG =
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1000&q=70';

/**
 * "About us" — a full-bleed primary band followed by an alternating
 * text/image row on the cream background.
 */
export default function AboutSection() {
  const { t } = useTranslation();

  return (
    <section>
      {/* Full-bleed green band */}
      <div className="bg-primary text-white">
        <Container className="grid items-center gap-10 py-16 md:grid-cols-2">
          <div>
            <h2 className="text-h1">{t('home.aboutHeading')}</h2>
            <p className="mt-3 text-h3 font-normal text-white/90">{t('home.aboutLead')}</p>
            <p className="mt-5 max-w-xl text-body-lg text-white/85">{t('home.aboutBody')}</p>
          </div>
          <img
            src={BAND_IMG}
            alt=""
            aria-hidden="true"
            loading="lazy"
            onError={onImageError}
            className="h-72 w-full rounded-card object-cover shadow-card"
          />
        </Container>
      </div>

      {/* Alternating cream row */}
      <Container className="grid items-center gap-10 py-16 md:grid-cols-2">
        <img
          src={ROW_IMG}
          alt=""
          aria-hidden="true"
          loading="lazy"
          onError={onImageError}
          className="order-2 h-72 w-full rounded-card object-cover shadow-card md:order-1"
        />
        <div className="order-1 md:order-2">
          <h2 className="text-h2 text-ink">{t('home.aboutBody2Heading')}</h2>
          <p className="mt-4 max-w-xl text-body-lg text-ink/70">{t('home.aboutBody2')}</p>
        </div>
      </Container>
    </section>
  );
}
