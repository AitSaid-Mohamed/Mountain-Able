import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mountain, Sparkles, CalendarDays, MapPin } from 'lucide-react';
import { Spinner } from '../ui/index.js';
import { GROUP_COLOR, GROUPS, iconFor } from '../../lib/poi.js';
import { cn, formatDate } from '../../lib/utils.js';

/**
 * "Along the way": platform villages, attractions and events from our database,
 * then OSM POIs (grouped, toggleable, with distance from the route). Platform
 * data and OSM data are clearly separated and labelled by source.
 */
export default function AlongTheWay({
  platform, pois = [], poisLoading, poisUnavailable, visibleGroups, onToggleGroup, locale,
}) {
  const { t } = useTranslation();
  const { villagesAlong = [], attractionsByCategory = {}, eventsAlong = [] } = platform ?? {};
  const poisByGroup = GROUPS.map((g) => [g, pois.filter((p) => p.group === g)]).filter(([, list]) => list.length);

  return (
    <div className="space-y-6">
      {/* Platform villages */}
      {villagesAlong.length > 0 && (
        <section>
          <h4 className="mb-2 flex items-center gap-2 text-body font-semibold text-ink">
            <Mountain size={16} className="text-primary" /> {t('route.along.villages')}
          </h4>
          <ul className="space-y-2">
            {villagesAlong.map((v) => (
              <li key={v._id} className="flex items-center justify-between gap-2 text-small">
                <Link to={`/villages/${v.slug}`} className="font-medium text-primary hover:underline">{v.name}</Link>
                <span className="text-ink/50">{t('route.along.passWithin', { km: v.distanceKm })}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Attractions */}
      {Object.keys(attractionsByCategory).length > 0 && (
        <section>
          <h4 className="mb-2 flex items-center gap-2 text-body font-semibold text-ink">
            <Sparkles size={16} className="text-primary" /> {t('route.along.attractions')}
          </h4>
          <div className="space-y-2">
            {Object.entries(attractionsByCategory).map(([cat, { items }]) => (
              <div key={cat} className="text-small">
                <span className="font-medium text-ink/70">{cat}: </span>
                <span className="text-ink/60">{items.map((i) => i.name).join(', ')}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Events */}
      {eventsAlong.length > 0 && (
        <section>
          <h4 className="mb-2 flex items-center gap-2 text-body font-semibold text-ink">
            <CalendarDays size={16} className="text-primary" /> {t('route.along.events')}
          </h4>
          <ul className="space-y-1.5 text-small">
            {eventsAlong.map((e) => (
              <li key={e._id} className="text-ink/70">
                <span className="font-medium text-ink">{e.title}</span>
                {e.village && <> · {e.village.name}</>} · {formatDate(e.startDate, locale)}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* OSM POIs */}
      <section>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h4 className="flex items-center gap-2 text-body font-semibold text-ink">
            <MapPin size={16} className="text-primary" /> {t('route.along.pois')}
            <span className="text-small font-normal text-ink/40">· {t('route.along.poisVia')}</span>
          </h4>
        </div>

        {/* Category toggles */}
        <div className="mb-3 flex flex-wrap gap-2">
          {GROUPS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => onToggleGroup(g)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-[12px] font-medium transition',
                visibleGroups.has(g) ? 'text-white' : 'text-ink/50'
              )}
              style={visibleGroups.has(g) ? { backgroundColor: GROUP_COLOR[g], borderColor: GROUP_COLOR[g] } : { borderColor: '#ddd' }}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: visibleGroups.has(g) ? '#fff' : GROUP_COLOR[g] }} />
              {t(`route.poi.${g}`)}
            </button>
          ))}
        </div>

        {poisLoading ? (
          <p className="flex items-center gap-2 text-small text-ink/50"><Spinner size={16} /> {t('route.along.loadingPois')}</p>
        ) : poisUnavailable ? (
          <p className="rounded-card bg-amber-50 p-3 text-small text-amber-800">{t('route.along.poisUnavailable')}</p>
        ) : pois.length === 0 ? (
          <p className="text-small text-ink/50">{t('route.along.noPois')}</p>
        ) : (
          <div className="space-y-4">
            {poisByGroup.map(([group, list]) => (
              <div key={group}>
                <p className="mb-1 text-[12px] font-semibold uppercase tracking-wide" style={{ color: GROUP_COLOR[group] }}>
                  {t(`route.poi.${group}`)}
                </p>
                <ul className="space-y-1">
                  {list.filter((p) => visibleGroups.has(p.group)).map((p) => {
                    const Icon = iconFor(p.sub);
                    return (
                      <li key={p.id} className="flex items-center justify-between gap-2 text-small">
                        <span className="flex min-w-0 items-center gap-2">
                          <Icon size={14} style={{ color: GROUP_COLOR[group] }} className="shrink-0" aria-hidden="true" />
                          <span className="truncate text-ink/80">{p.name || t('route.poi.unnamed', { type: t(`route.poi.${p.sub}`) })}</span>
                        </span>
                        <span className="shrink-0 text-ink/40">{t('route.along.fromRoute', { km: p.distanceKm })}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
