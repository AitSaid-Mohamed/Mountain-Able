import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, MountainSnow } from 'lucide-react';
import Container from '../components/layout/Container.jsx';
import { Rating, Skeleton, ErrorState, EmptyState, Button, Badge } from '../components/ui/index.js';
import Gallery from '../components/village/Gallery.jsx';
import VillageSidebar from '../components/village/VillageSidebar.jsx';
import ReviewsSection from '../components/village/ReviewsSection.jsx';
import { useFetch } from '../hooks/useFetch.js';

export default function VillageDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: village, loading, error, refetch } = useFetch(`/villages/${slug}`, { deps: [slug] });

  const BackButton = (
    <button
      type="button"
      onClick={() => navigate(-1)}
      aria-label={t('village.backToVillages')}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink shadow-card transition hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <ChevronLeft size={22} />
    </button>
  );

  if (loading) {
    return (
      <Container className="py-8">
        {BackButton}
        <Skeleton className="mt-6 h-10 w-72" />
        <Skeleton className="mt-3 h-5 w-96" />
        <Skeleton className="mt-6 h-64 w-full rounded-card md:h-[351px]" />
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_341px]">
          <div className="space-y-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Skeleton className="h-80 rounded-card" />
        </div>
      </Container>
    );
  }

  if (error) {
    const notFound = error.response?.status === 404;
    return (
      <Container className="py-12">
        {BackButton}
        {notFound ? (
          <EmptyState
            icon={MountainSnow}
            title={t('village.notFound')}
            description={t('village.notFoundHint')}
            action={
              <Button as={Link} to="/villages" variant="brand">
                {t('village.backToVillages')}
              </Button>
            }
          />
        ) : (
          <ErrorState onRetry={refetch} />
        )}
      </Container>
    );
  }

  if (!village) return null;
  const { attractions = [], events = [] } = village;

  return (
    <Container className="py-8">
      {BackButton}

      {/* Header block */}
      <div className="mt-6">
        <h1 className="text-display text-ink">{t('village.aboutHeading')}</h1>
        <p className="mt-2 max-w-2xl text-body-lg text-ink/60">{t('village.aboutSubtitle')}</p>
      </div>

      {/* Gallery */}
      <div className="mt-6">
        <Gallery images={village.images} cover={village.coverImage} name={village.name} />
      </div>

      {/* Body + sidebar */}
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_341px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <h2 className="text-h1 text-primary">{village.name}</h2>
            {village.ratingCount > 0 ? (
              <Rating value={village.ratingAverage} count={village.ratingCount} showValue size={20} />
            ) : (
              <Badge tone="neutral">{t('card.noReviews')}</Badge>
            )}
          </div>

          <div className="mt-6 flex items-center gap-4">
            <h3 className="shrink-0 text-h2 text-ink">{t('village.descriptionHeading')}</h3>
            <span className="h-px flex-1 bg-ink/15" aria-hidden="true" />
          </div>
          <p className="mt-4 whitespace-pre-line text-body-lg text-ink/75">{village.description}</p>

          {(village.altitude || village.population) && (
            <div className="mt-6 flex flex-wrap gap-3">
              {village.altitude != null && (
                <Badge tone="neutral">
                  {village.altitude} {t('village.meters')}
                </Badge>
              )}
              {village.population != null && (
                <Badge tone="neutral">
                  {t('village.stats.population')}: {village.population.toLocaleString()}
                </Badge>
              )}
            </div>
          )}
        </div>

        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <VillageSidebar village={village} attractions={attractions} events={events} />
        </aside>
      </div>

      {/* Reviews */}
      <ReviewsSection village={village} onRatingChange={refetch} />
    </Container>
  );
}
