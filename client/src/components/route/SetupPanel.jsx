import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LocateFixed, Search, Car, Bike, Footprints } from 'lucide-react';
import { Input, Select, Button } from '../ui/index.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import api from '../../lib/api.js';

const PROFILES = [
  { value: 'driving-car', key: 'car', icon: Car },
  { value: 'cycling-regular', key: 'bike', icon: Bike },
  { value: 'foot-walking', key: 'foot', icon: Footprints },
];

/**
 * Journey setup: start point (geolocation with explicit permission, town
 * search, or map click handled by the parent), travel profile and optional
 * date. Geolocation is never requested on load — only on the button press.
 */
export default function SetupPanel({ start, startLabel, onStart, profile, onProfile, date, onDate, onPlan, planning }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState('');
  const debounced = useDebounce(query, 450);

  useEffect(() => {
    let active = true;
    if (debounced.trim().length < 3) { setResults([]); return; }
    api.get('/routes/geocode', { params: { q: debounced } })
      .then((r) => active && setResults(r.data.data))
      .catch(() => active && setResults([]));
    return () => { active = false; };
  }, [debounced]);

  const useMyLocation = () => {
    setGeoError('');
    if (!navigator.geolocation) { setGeoError(t('route.setup.geoDenied')); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocating(false); onStart({ lat: pos.coords.latitude, lng: pos.coords.longitude }, t('route.setup.useMyLocation')); },
      () => { setLocating(false); setGeoError(t('route.setup.geoDenied')); },
      { timeout: 10000 }
    );
  };

  const pick = (r) => { onStart({ lat: r.lat, lng: r.lng }, r.label.split(',').slice(0, 2).join(',')); setQuery(''); setResults([]); };

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 text-small font-medium text-ink">{t('route.setup.start')}</p>
        <Button variant="outline" size="sm" className="mb-2 w-full" onClick={useMyLocation} loading={locating}>
          <LocateFixed size={16} /> {locating ? t('route.setup.locating') : t('route.setup.useMyLocation')}
        </Button>
        <div className="relative">
          <Input icon={Search} placeholder={t('route.setup.startPlaceholder')} value={query} onChange={(e) => setQuery(e.target.value)} />
          {results.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-card bg-white py-1 shadow-card">
              {results.map((r, i) => (
                <li key={i}>
                  <button type="button" onClick={() => pick(r)} className="block w-full truncate px-3 py-2 text-left text-small hover:bg-black/5">
                    {r.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {start && <p className="mt-1.5 text-small text-primary">✓ {startLabel || `${start.lat.toFixed(3)}, ${start.lng.toFixed(3)}`}</p>}
        {geoError && <p className="mt-1.5 text-small text-red-600">{geoError}</p>}
        <p className="mt-1.5 text-[12px] text-ink/45">{t('route.setup.clickHint')}</p>
      </div>

      <div>
        <p className="mb-1.5 text-small font-medium text-ink">{t('route.setup.profile')}</p>
        <div className="grid grid-cols-3 gap-2">
          {PROFILES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => onProfile(p.value)}
              className={`flex flex-col items-center gap-1 rounded-card border py-2 text-small transition ${profile === p.value ? 'border-primary bg-primary/10 text-primary' : 'border-ink/15 text-ink/60 hover:border-primary/40'}`}
            >
              <p.icon size={20} aria-hidden="true" />
              {t(`route.setup.${p.key}`)}
            </button>
          ))}
        </div>
      </div>

      <Input type="date" label={t('route.setup.date')} value={date} onChange={(e) => onDate(e.target.value)} hint={t('route.setup.dateHint')} />

      <Button variant="brand" className="w-full" onClick={onPlan} loading={planning} disabled={!start}>
        {planning ? t('route.setup.planning') : t('route.setup.plan')}
      </Button>
    </div>
  );
}
