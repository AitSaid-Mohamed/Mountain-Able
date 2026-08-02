import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Info, Save, Printer, ExternalLink, Pencil, Route as RouteIcon, TrendingUp, MapPinned } from 'lucide-react';
import Container from '../components/layout/Container.jsx';
import { Card, Button, Skeleton, ErrorState } from '../components/ui/index.js';
import RouteMap from '../components/route/RouteMap.jsx';
import SetupPanel from '../components/route/SetupPanel.jsx';
import ElevationChart from '../components/route/ElevationChart.jsx';
import AdvisoryList from '../components/route/AdvisoryList.jsx';
import AlongTheWay from '../components/route/AlongTheWay.jsx';
import DirectionsList from '../components/route/DirectionsList.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useModal } from '../context/ModalContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../lib/api.js';
import { GROUPS } from '../lib/poi.js';
import { formatDistance, formatDuration } from '../lib/utils.js';

const EXTERNAL_MODE = { 'driving-car': 'driving', 'cycling-regular': 'bicycling', 'foot-walking': 'walking' };

export default function RoutePlannerPage() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { openLogin } = useModal();
  const toast = useToast();
  const { data: village, loading, error, refetch } = useFetch(`/villages/${slug}`, { deps: [slug] });

  const [start, setStart] = useState(null);
  const [startLabel, setStartLabel] = useState('');
  const [profile, setProfile] = useState('driving-car');
  const [date, setDate] = useState('');
  const [plan, setPlan] = useState(null);
  const [planning, setPlanning] = useState(false);
  const [planError, setPlanError] = useState('');
  const [setupOpen, setSetupOpen] = useState(true);

  const [pois, setPois] = useState([]);
  const [surfaceAdv, setSurfaceAdv] = useState([]);
  const [poisLoading, setPoisLoading] = useState(false);
  const [poisUnavailable, setPoisUnavailable] = useState(false);
  const [visibleGroups, setVisibleGroups] = useState(new Set(GROUPS));
  const [hovered, setHovered] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const setStartPoint = (loc, label) => { setStart(loc); setStartLabel(label ?? ''); };

  const fetchCorridor = useCallback(async (geometry) => {
    setPoisLoading(true);
    setPoisUnavailable(false);
    const step = Math.max(1, Math.floor(geometry.length / 60));
    const simplified = geometry.filter((_, i) => i % step === 0).map((c) => `${c[0]},${c[1]}`).join(';');
    try {
      const res = await api.get('/routes/corridor', { params: { geometry: simplified } });
      setPois(res.data.data.pois);
      setSurfaceAdv(res.data.data.surfaceAdvisories ?? []);
      setPoisUnavailable(res.data.data.unavailable);
    } catch {
      setPoisUnavailable(true);
    } finally {
      setPoisLoading(false);
    }
  }, []);

  const doPlan = async () => {
    if (!start || !village) return;
    setPlanning(true);
    setPlanError('');
    setSaved(false);
    setPois([]);
    setSurfaceAdv([]);
    try {
      const res = await api.post('/routes/plan', { start, villageId: village._id, profile, date: date || undefined });
      const data = res.data.data;
      setPlan(data);
      setSetupOpen(false);
      if (data.route) fetchCorridor(data.route.geometry);
      else setPlanError(t(`route.error.${data.routeError ?? 'generic'}`, { defaultValue: t('route.error.generic') }));
    } catch (err) {
      setPlanError(err.response?.data?.message ?? t('route.error.generic'));
    } finally {
      setPlanning(false);
    }
  };

  const save = async () => {
    if (!user) { toast.info(t('village.loginToTrack')); openLogin(); return; }
    if (!plan?.route) return;
    setSaving(true);
    try {
      await api.post('/me/routes', {
        villageId: village._id, startLabel, startLocation: start, profile,
        distance: plan.route.distance, duration: plan.route.duration, geometry: plan.route.geometry,
      });
      setSaved(true);
      toast.success(t('route.actions.saved'));
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('auth.errors.generic'));
    } finally {
      setSaving(false);
    }
  };

  const toggleGroup = (g) =>
    setVisibleGroups((prev) => {
      const next = new Set(prev);
      next.has(g) ? next.delete(g) : next.add(g);
      return next;
    });

  if (loading) return <Container className="py-10"><Skeleton className="h-[70vh] w-full rounded-card" /></Container>;
  if (error) return <Container className="py-10"><ErrorState error={error} onRetry={refetch} /></Container>;
  if (!village) return null;

  const route = plan?.route;
  const advisories = [...(plan?.advisories ?? []), ...surfaceAdv];
  const externalUrl = route
    ? `https://www.google.com/maps/dir/?api=1&origin=${start.lat},${start.lng}&destination=${village.location.lat},${village.location.lng}&travelmode=${EXTERNAL_MODE[profile]}`
    : null;

  return (
    <Container className="py-6">
      <Link to={`/villages/${slug}`} className="mb-3 inline-flex items-center gap-2 text-body text-ink/60 hover:text-primary no-print">
        <ArrowLeft size={18} /> {t('route.backToVillage')}
      </Link>
      <h1 className="text-h1 text-ink">{t('route.title', { village: village.name })}</h1>

      {/* Safety note */}
      <div className="mt-3 flex items-start gap-2 rounded-card bg-cta/5 p-3 text-small text-ink/70">
        <Info size={18} className="mt-0.5 shrink-0 text-cta" aria-hidden="true" />
        {t('route.safety')}
      </div>

      <div className="mt-5 flex flex-col gap-5 lg:flex-row">
        {/* Map */}
        <div className="h-[45vh] overflow-hidden rounded-card shadow-card lg:h-[76vh] lg:w-3/5 no-print">
          <RouteMap
            geometry={route?.geometry ?? []}
            destination={{ ...village.location, name: village.name, region: village.region }}
            start={start}
            pois={pois}
            villagesAlong={plan?.platform?.villagesAlong ?? []}
            visibleGroups={visibleGroups}
            hoveredPoint={hovered}
            onMapClick={(latlng) => setStartPoint({ lat: latlng.lat, lng: latlng.lng })}
            className="h-full"
          />
        </div>

        {/* Side panel */}
        <div className="lg:h-[76vh] lg:w-2/5 lg:overflow-y-auto lg:pr-1">
          <div className="space-y-5">
            {/* Setup / collapsed summary */}
            <Card className="p-5 no-print">
              {setupOpen ? (
                <>
                  <h2 className="mb-3 text-h3 text-ink">{t('route.setup.title')}</h2>
                  <SetupPanel
                    start={start} startLabel={startLabel} onStart={setStartPoint}
                    profile={profile} onProfile={setProfile} date={date} onDate={setDate}
                    onPlan={doPlan} planning={planning}
                  />
                </>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-small text-ink/70">
                    <span className="font-medium text-ink">{startLabel || t('route.setup.start')}</span> → {village.name} · {t(`route.setup.${profile === 'driving-car' ? 'car' : profile === 'cycling-regular' ? 'bike' : 'foot'}`)}
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => setSetupOpen(true)}><Pencil size={15} /> {t('common.edit')}</Button>
                </div>
              )}
            </Card>

            {planError && (
              <Card className="border-l-4 border-l-amber-500 bg-amber-50 p-4 text-small text-amber-800">{planError}</Card>
            )}

            {route && (
              <>
                {/* Summary */}
                <Card className="p-5">
                  <h2 className="mb-3 flex items-center gap-2 text-h3 text-ink"><RouteIcon size={18} className="text-primary" /> {t('route.summary.title')}</h2>
                  <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
                    <Metric label={t('route.summary.distance')} value={formatDistance(route.distance)} />
                    <Metric label={t('route.summary.duration')} value={formatDuration(route.duration)} />
                    <Metric label={t('route.summary.ascent')} value={plan.summary ? `${plan.summary.ascent} m` : '—'} />
                    <Metric label={t('route.summary.maxAltitude')} value={plan.summary ? `${plan.summary.maxAltitude} m` : '—'} />
                  </div>
                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-2 no-print">
                    <Button variant="brand" size="sm" onClick={save} loading={saving} disabled={saved}>
                      <Save size={15} /> {saved ? t('route.actions.saved') : t('route.actions.save')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.print()}><Printer size={15} /> {t('route.actions.print')}</Button>
                    <Button as="a" href={externalUrl} target="_blank" rel="noopener noreferrer" variant="outline" size="sm">
                      <ExternalLink size={15} /> {t('route.actions.external')}
                    </Button>
                  </div>
                </Card>

                {/* Advisories */}
                <Card className="p-5">
                  <h2 className="mb-3 text-h3 text-ink">{t('route.advisories.title')}</h2>
                  <AdvisoryList advisories={advisories} />
                </Card>

                {/* Elevation */}
                <Card className="p-5 no-print">
                  <h2 className="mb-3 flex items-center gap-2 text-h3 text-ink"><TrendingUp size={18} className="text-primary" /> {t('route.elevation.title')}</h2>
                  <ElevationChart elevation={route.elevation} onHover={setHovered} />
                </Card>

                {/* Along the way */}
                <Card className="p-5">
                  <h2 className="mb-3 flex items-center gap-2 text-h3 text-ink"><MapPinned size={18} className="text-primary" /> {t('route.along.title')}</h2>
                  <AlongTheWay
                    platform={plan.platform}
                    pois={pois}
                    poisLoading={poisLoading}
                    poisUnavailable={poisUnavailable}
                    visibleGroups={visibleGroups}
                    onToggleGroup={toggleGroup}
                    locale={i18n.language}
                  />
                </Card>

                {/* Directions */}
                <Card className="p-5">
                  <h2 className="mb-3 text-h3 text-ink">{t('route.directions.title')}</h2>
                  <DirectionsList steps={route.steps} />
                </Card>

                <p className="px-1 pb-4 text-[12px] text-ink/40">{t('route.attribution', { provider: route.provider })}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-card bg-black/[0.03] p-3">
      <div className="text-h3 text-ink">{value}</div>
      <div className="text-small text-ink/55">{label}</div>
    </div>
  );
}
