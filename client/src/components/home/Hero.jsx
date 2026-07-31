import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import Container from '../layout/Container.jsx';
import { Skeleton } from '../ui/index.js';
import { onImageError, FALLBACK_IMAGE, mediaUrl } from '../../lib/utils.js';

/**
 * Home hero. Left: headline + intro + CTA. Right: three top-rated village
 * photos as overlapping, slightly rotated rounded cards.
 * Per the design correction, the headline uses only two tones (ink + brand
 * green) instead of the Figma's three competing colours.
 */
export default function Hero({ villages = [], loading }) {
  const { t } = useTranslation();
  const photos = villages.slice(0, 3);

  return (
    <section className="bg-cream pt-10 pb-14 md:pt-16 md:pb-20">
      <Container className="grid items-center gap-10 lg:grid-cols-2">
        {/* Left */}
        <div>
          <h1 className="text-display text-ink">
            {t('home.heroTitlePlain')}{' '}
            <span className="text-primary">{t('home.heroTitleAccent')}</span>
          </h1>
          <p className="mt-5 max-w-xl text-body-lg text-ink/70">{t('home.heroIntro')}</p>
          <Link
            to="/villages"
            className="mt-8 inline-flex items-center gap-2 rounded-pill bg-cta px-7 py-3 text-body font-semibold text-white transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cta/50"
          >
            {t('home.discoverVillages')}
            <ChevronRight size={20} aria-hidden="true" />
          </Link>
        </div>

        {/* Right — overlapping photo stack */}
        <div className="relative mx-auto hidden h-[360px] w-full max-w-md lg:block">
          {loading
            ? [0, 1, 2].map((i) => (
                <div key={i} style={{ left: `${i * 96}px`, top: `${i * 44}px` }} className="absolute">
                  <Skeleton className="h-60 w-60 rounded-card" />
                </div>
              ))
            : photos.map((v, i) => (
                <Link
                  key={v._id}
                  to={`/villages/${v.slug}`}
                  className="absolute block h-60 w-60 overflow-hidden rounded-card shadow-card transition hover:z-10 hover:scale-[1.03]"
                  style={{
                    left: `${i * 96}px`,
                    top: `${i * 44}px`,
                    transform: `rotate(${[-4, 2, -2][i]}deg)`,
                    zIndex: 3 - i,
                  }}
                >
                  <img
                    src={mediaUrl(v.coverImage) || FALLBACK_IMAGE}
                    alt={v.name}
                    loading="lazy"
                    onError={onImageError}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-small font-semibold text-white">
                    {v.name}
                  </span>
                </Link>
              ))}
        </div>

        {/* Mobile: simple single image */}
        {!loading && photos[0] && (
          <div className="lg:hidden">
            <img
              src={mediaUrl(photos[0].coverImage) || FALLBACK_IMAGE}
              alt={photos[0].name}
              loading="lazy"
              onError={onImageError}
              className="h-56 w-full rounded-card object-cover shadow-card"
            />
          </div>
        )}
      </Container>
    </section>
  );
}
