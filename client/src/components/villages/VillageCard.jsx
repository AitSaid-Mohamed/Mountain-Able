import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react';
import { Rating } from '../ui/index.js';
import { cn, onImageError, FALLBACK_IMAGE, mediaUrl } from '../../lib/utils.js';

/**
 * Village summary card (Figma 12:148, tightened per spec):
 * a wide cover image above a shrunk two-thumbnail row, the name in `primary`,
 * a rating + review-count + region row, a 3-line-clamped description, and a
 * "See Details" CTA. Lifts on hover. Reads as a scannable summary.
 */
export default function VillageCard({ village, onMouseEnter, onMouseLeave, className }) {
  const { t } = useTranslation();
  const cover = village.coverImage || village.images?.[0] || FALLBACK_IMAGE;
  const thumbs = (village.images ?? []).filter((i) => i !== cover).slice(0, 2);
  while (thumbs.length < 2) thumbs.push(cover);

  return (
    <article
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        'group flex flex-col rounded-card bg-white p-[21px] shadow-card transition duration-200',
        'hover:-translate-y-1 hover:shadow-[3px_8px_18px_rgba(0,0,0,0.28)]',
        className
      )}
    >
      {/* Image composition */}
      <div className="flex flex-col gap-2">
        <img
          src={mediaUrl(cover)}
          alt={village.name}
          loading="lazy"
          onError={onImageError}
          className="h-44 w-full rounded-card object-cover"
        />
        <div className="grid grid-cols-2 gap-2">
          {thumbs.map((src, i) => (
            <img
              key={i}
              src={mediaUrl(src)}
              alt=""
              aria-hidden="true"
              loading="lazy"
              onError={onImageError}
              className="h-20 w-full rounded-card object-cover"
            />
          ))}
        </div>
      </div>

      {/* Text */}
      <div className="mt-4 flex flex-1 flex-col">
        <h3 className="text-h3 text-primary">
          <Link to={`/villages/${village.slug}`} className="hover:underline">
            {village.name}
          </Link>
        </h3>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-ink/60">
          {village.ratingCount > 0 ? (
            <Rating value={village.ratingAverage} showValue size={16} />
          ) : (
            <span className="text-ink/40">{t('card.noReviews')}</span>
          )}
          {village.ratingCount > 0 && (
            <span>{t('card.reviewsCount', { count: village.ratingCount })}</span>
          )}
          <span className="inline-flex items-center gap-1">
            <MapPin size={14} aria-hidden="true" />
            {village.region}
          </span>
        </div>

        <p className="mt-3 line-clamp-3 text-body text-ink/70">
          {village.shortDescription || village.description}
        </p>

        <div className="mt-4 flex justify-end pt-2">
          <Link
            to={`/villages/${village.slug}`}
            className="inline-flex items-center rounded-pill bg-cta px-5 py-2 text-small font-semibold text-white transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cta/50"
          >
            {t('common.seeDetails')}
          </Link>
        </div>
      </div>
    </article>
  );
}
