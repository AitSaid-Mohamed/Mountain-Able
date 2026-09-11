import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Clock, Info } from 'lucide-react';
import { Card, Select, Badge, Skeleton, EmptyState, ErrorState } from '../ui/index.js';
import ServiceIcon from './ServiceIcon.jsx';
import { useFetch } from '../../hooks/useFetch.js';

const RADII = [25, 50, 60, 100, 200];

/**
 * "Neighbours" — the directory, browsable without raising anything.
 *
 * Often the officer only wants to know who has a minibus; making them open a
 * request to find out would be a worse product and would pollute the demand
 * record the regional authority reads.
 */
export default function NeighboursTab() {
  const { t } = useTranslation();
  const [radiusKm, setRadiusKm] = useState(60);
  const [serviceTypeId, setServiceTypeId] = useState('');

  const { data: types } = useFetch('/service-types');
  const { data, loading, error, refetch } = useFetch('/coordination/candidates', {
    params: { radiusKm, ...(serviceTypeId && { serviceTypeId }) },
  });

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const candidates = data?.candidates ?? [];
  const nearest = data?.nearest ?? [];

  return (
    <div className="space-y-6">
      <p className="max-w-3xl text-body text-ink/70">{t('coord.neighbours.intro')}</p>

      <div className="flex flex-wrap items-end gap-4">
        <div className="w-56">
          <Select label={t('coord.neighbours.service')} value={serviceTypeId}
            onChange={(e) => setServiceTypeId(e.target.value)}
            options={[
              { value: '', label: t('coord.neighbours.anyService') },
              ...(types ?? []).map((s) => ({ value: s._id, label: s.name })),
            ]} />
        </div>
        <div className="w-44">
          <Select label={t('coord.neighbours.radius')} value={String(radiusKm)}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            options={RADII.map((r) => ({ value: String(r), label: `${r} km` }))} />
        </div>
      </div>

      {/* Provenance: the platform never presents straight-line order as road order. */}
      {data?.rankedBy === 'straight-line' && candidates.length > 0 && (
        <div className="flex items-start gap-2 rounded-card bg-amber-50 p-3 text-small text-[#9a6b00]">
          <Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{t('coord.neighbours.straightLineNote')}</span>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((i) => <Skeleton key={i} className="h-36 rounded-card" />)}
        </div>
      ) : !data?.hasAnchor ? (
        <EmptyState icon={MapPin} title={t('coord.neighbours.noAnchor')}
          description={t('coord.neighbours.noAnchorHint')} />
      ) : candidates.length === 0 ? (
        <div>
          <EmptyState icon={MapPin} title={t('coord.neighbours.none')}
            description={t('coord.neighbours.noneHint', { radius: radiusKm })} />
          {/* Suggestions, not a silent widening: an officer who believes they
              contacted neighbours must not have quietly contacted a comune four
              hours away. */}
          {nearest.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 text-h3 text-ink">{t('coord.neighbours.nearestTitle')}</h3>
              <p className="mb-4 text-body text-ink/60">{t('coord.neighbours.nearestHint')}</p>
              <div className="grid gap-4 md:grid-cols-2">
                {nearest.map((c) => <NeighbourCard key={c.municipalityId} c={c} />)}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {candidates.map((c) => <NeighbourCard key={c.municipalityId} c={c} />)}
        </div>
      )}
    </div>
  );
}

function NeighbourCard({ c }) {
  const { t } = useTranslation();
  const { data: capabilities } = useFetch('/capabilities', {
    params: { municipalityId: c.municipalityId },
  });

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-h3 text-ink">{c.municipality?.name}</h4>
          <p className="text-small text-ink/55">
            {c.municipality?.province} — {c.municipality?.region}
          </p>
        </div>
        <div className="shrink-0 text-right">
          {c.travelMinutes != null ? (
            <>
              <div className="flex items-center justify-end gap-1.5 text-body font-semibold text-primary">
                <Clock size={15} aria-hidden="true" />
                {t('coord.minutes', { count: c.travelMinutes })}
              </div>
              <p className="text-small text-ink/50">{t('coord.byRoad', { km: c.travelKm })}</p>
            </>
          ) : (
            <p className="text-small text-ink/50">{t('coord.straightKm', { km: c.straightKm })}</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(capabilities ?? []).length === 0 ? (
          <p className="text-small text-ink/50">{t('coord.neighbours.noneDeclared')}</p>
        ) : (
          (capabilities ?? []).map((cap) => (
            <Badge key={cap._id} tone="primary">
              <ServiceIcon name={cap.serviceTypeId?.icon} size={12} aria-hidden="true" />
              {cap.serviceTypeId?.name}
            </Badge>
          ))
        )}
      </div>
    </Card>
  );
}
