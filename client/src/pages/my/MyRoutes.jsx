import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Route as RouteIcon, Trash2, Car, Bike, Footprints, ArrowRight } from 'lucide-react';
import Card from '../../components/ui/Card.jsx';
import { Button, Skeleton, EmptyState, ErrorState, ConfirmDialog } from '../../components/ui/index.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../context/ToastContext.jsx';
import api from '../../lib/api.js';
import { formatDistance, formatDuration, formatDate } from '../../lib/utils.js';

const PROFILE_ICON = { 'driving-car': Car, 'cycling-regular': Bike, 'foot-walking': Footprints };

export default function MyRoutes() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const { data, loading, error, refetch } = useFetch('/me/routes');
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const routes = data ?? [];

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/me/routes/${toDelete._id}`);
      toast.success(t('my.routes.remove'));
      setToDelete(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('auth.errors.generic'));
    } finally {
      setBusy(false);
    }
  };

  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (loading) return <div className="space-y-4">{[0, 1].map((i) => <Skeleton key={i} className="h-24 rounded-card" />)}</div>;
  if (routes.length === 0) {
    return (
      <EmptyState
        icon={RouteIcon}
        title={t('my.routes.empty')}
        action={<Button as={Link} to="/villages" variant="brand">{t('my.routes.emptyCta')}</Button>}
      />
    );
  }

  return (
    <div className="space-y-4">
      {routes.map((r) => {
        const Icon = PROFILE_ICON[r.profile] ?? Car;
        return (
          <Card key={r._id} className="flex flex-wrap items-center gap-4 p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon size={20} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-body font-medium text-ink">
                {r.startLabel || t('route.setup.start')} <span className="text-ink/40">{t('my.routes.to')}</span>{' '}
                {r.villageId ? (
                  <Link to={`/villages/${r.villageId.slug}`} className="text-primary hover:underline">{r.villageId.name}</Link>
                ) : '—'}
              </p>
              <p className="text-small text-ink/55">
                {formatDistance(r.distance)} · {formatDuration(r.duration)} · {formatDate(r.createdAt, i18n.language)}
              </p>
            </div>
            {r.villageId && (
              <Button as={Link} to={`/villages/${r.villageId.slug}/route`} variant="outline" size="sm">
                {t('my.routes.open')} <ArrowRight size={15} />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setToDelete(r)}>
              <Trash2 size={15} className="text-red-500" />
            </Button>
          </Card>
        );
      })}

      <ConfirmDialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} onConfirm={remove} loading={busy}
        message={t('my.routes.confirmRemove')} />
    </div>
  );
}
