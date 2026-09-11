import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as Icons from 'lucide-react';
import { MapPin, Building2, Sparkles, CalendarDays, MessageSquare, Route } from 'lucide-react';
import { Card, Button } from '../ui/index.js';
import DetailMap from './DetailMap.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatDate } from '../../lib/utils.js';

/** Render a lucide icon by its name string, with a safe fallback. */
function LucideIcon({ name, ...props }) {
  const Cmp = Icons[name] ?? Sparkles;
  return <Cmp {...props} />;
}

/** Labelled pill field: icon + value. */
function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <p className="mb-1.5 text-small font-medium text-ink">{label}</p>
      <div className="flex items-center gap-2 rounded-pill bg-white px-4 py-2.5 text-body text-ink shadow-input">
        <Icon size={18} className="shrink-0 text-primary" aria-hidden="true" />
        <span className="truncate">{children}</span>
      </div>
    </div>
  );
}

export default function VillageSidebar({ village, attractions = [], events = [] }) {
  const { t, i18n } = useTranslation();
  const muni = village.municipalityId;

  const stats = [
    { icon: Sparkles, value: attractions.length, label: t('village.stats.attractions') },
    { icon: CalendarDays, value: events.length, label: t('village.stats.events') },
    { icon: MessageSquare, value: village.ratingCount ?? 0, label: t('village.stats.reviews') },
  ];

  // Group attractions by category name.
  const byCategory = attractions.reduce((acc, a) => {
    const cat = a.categoryId ?? { name: '—', icon: 'Sparkles' };
    (acc[cat.name] ??= { icon: cat.icon, items: [] }).items.push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* Primary route-planning entry point — prominent and above the fold. */}
      <Button
        as={Link}
        to={`/villages/${village.slug}/route`}
        variant="brand"
        size="lg"
        className="w-full"
      >
        <Route size={20} aria-hidden="true" /> {t('village.planJourney')}
      </Button>

      <Card className="h-[220px] overflow-hidden p-0">
        <DetailMap location={village.location} name={village.name} className="h-full" />
      </Card>

      <Field label={t('village.location')} icon={MapPin}>
        {village.province} — {village.region}
      </Field>

      {muni?.name && (
        <Field label={t('village.municipality')} icon={Building2}>
          {muni.name}
        </Field>
      )}

      {/* Stats strip — honest metrics the DB supports (no invented tourist/hotel counts). */}
      <Card className="grid grid-cols-3 divide-x divide-ink/10 p-4">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center px-1 text-center">
            <s.icon size={20} className="text-primary" aria-hidden="true" />
            <span className="mt-1 text-h3 text-ink">{s.value}</span>
            <span className="text-small text-ink/60">{s.label}</span>
          </div>
        ))}
      </Card>

      {/* Attractions grouped by category */}
      <Card className="p-5">
        <h3 className="text-h3 text-ink">{t('village.attractionsHeading')}</h3>
        {attractions.length === 0 ? (
          <p className="mt-3 text-body text-ink/50">{t('village.noAttractions')}</p>
        ) : (
          <div className="mt-4 space-y-4">
            {Object.entries(byCategory).map(([cat, { icon, items }]) => (
              <div key={cat}>
                <div className="mb-2 flex items-center gap-2 text-small font-semibold text-primary">
                  <LucideIcon name={icon} size={16} aria-hidden="true" />
                  {cat}
                </div>
                <ul className="space-y-1.5 pl-6">
                  {items.map((a) => (
                    <li key={a._id} className="list-disc text-body text-ink/75 marker:text-primary/40">
                      {a.name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Upcoming events */}
      <Card className="p-5">
        <h3 className="text-h3 text-ink">{t('village.eventsHeading')}</h3>
        {events.length === 0 ? (
          <p className="mt-3 text-body text-ink/50">{t('village.noEvents')}</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {events.map((ev) => (
              <li key={ev._id} className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card bg-primary/10 text-primary">
                  <CalendarDays size={18} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-body font-medium text-ink">{ev.title}</p>
                  <p className="text-small text-ink/55">
                    {formatDate(ev.startDate, i18n.language)}
                    {ev.endDate && ev.endDate !== ev.startDate
                      ? ` – ${formatDate(ev.endDate, i18n.language)}`
                      : ''}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ClaimPrompt village={village} municipality={muni} />
    </div>
  );
}

/**
 * "Are you the municipality?" entry point into the officer-request flow, with
 * the municipality, region and province pre-filled from this village so an
 * officer arriving from their own page does not retype what we already know.
 *
 * Hidden from signed-in officers, admins and authorities — they already hold an
 * account, and offering them a request form would be noise. Logged-out visitors
 * and tourists see it, since either may turn out to represent the comune.
 */
function ClaimPrompt({ village, municipality }) {
  const { t } = useTranslation();
  const { user } = useAuth();

  if (user && user.role !== 'tourist') return null;

  const query = new URLSearchParams({
    ...(municipality?.name && { municipality: municipality.name }),
    ...(village.region && { region: village.region }),
    ...(village.province && { province: village.province }),
    village: village.name,
  });

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <Building2 size={18} className="shrink-0 text-primary" aria-hidden="true" />
        <h3 className="text-h3 text-ink">{t('claim.fromVillageTitle')}</h3>
      </div>
      <p className="mt-2 text-body text-ink/70">{t('claim.fromVillageBody')}</p>
      <Link
        to={`/claim?${query}`}
        className="mt-3 inline-block text-body font-semibold text-primary hover:underline"
      >
        {t('claim.fromVillageCta')} →
      </Link>
    </Card>
  );
}
