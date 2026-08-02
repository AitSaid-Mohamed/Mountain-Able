import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarDays, MapPin, CalendarX } from 'lucide-react';
import Container from '../components/layout/Container.jsx';
import { Card, Skeleton, EmptyState, ErrorState, Badge } from '../components/ui/index.js';
import { useFetch } from '../hooks/useFetch.js';
import { onImageError, FALLBACK_IMAGE, formatDate, mediaUrl } from '../lib/utils.js';

export default function EventsPage() {
  const { t, i18n } = useTranslation();
  const { data: events, loading, error, refetch } = useFetch('/events', {
    params: { upcoming: 'true' },
  });

  return (
    <Container className="py-12">
      <h1 className="text-display text-ink">{t('events.title')}</h1>
      <p className="mt-3 max-w-2xl text-body-lg text-ink/70">{t('events.subtitle')}</p>

      <div className="mt-10">
        {error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-40 w-full" />
                <div className="space-y-2 p-4">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : events?.length === 0 ? (
          <EmptyState icon={CalendarX} title={t('events.noEvents')} description={t('events.noEventsHint')} />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((ev) => (
              <Card key={ev._id} className="flex flex-col overflow-hidden">
                <img
                  src={mediaUrl(ev.image) || FALLBACK_IMAGE}
                  alt={ev.title}
                  loading="lazy"
                  onError={onImageError}
                  className="h-40 w-full object-cover"
                />
                <div className="flex flex-1 flex-col p-4">
                  <Badge tone="primary" icon={CalendarDays} className="self-start">
                    {formatDate(ev.startDate, i18n.language)}
                    {ev.endDate && ev.endDate !== ev.startDate ? ` – ${formatDate(ev.endDate, i18n.language)}` : ''}
                  </Badge>
                  <h2 className="mt-3 text-h3 text-ink">{ev.title}</h2>
                  {ev.description && (
                    <p className="mt-1 line-clamp-2 text-body text-ink/60">{ev.description}</p>
                  )}
                  {ev.villageId && (
                    <Link
                      to={`/villages/${ev.villageId.slug}`}
                      className="mt-3 inline-flex items-center gap-1 text-small font-semibold text-primary hover:underline"
                    >
                      <MapPin size={14} aria-hidden="true" />
                      {ev.villageId.name}
                      {ev.villageId.region ? `, ${ev.villageId.region}` : ''}
                    </Link>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
