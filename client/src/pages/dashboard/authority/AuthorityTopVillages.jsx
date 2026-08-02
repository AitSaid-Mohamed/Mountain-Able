import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, MapPin, Download } from 'lucide-react';
import { PageHeader } from '../../../components/dashboard/index.js';
import { Card, Select, Rating, Button, Skeleton, EmptyState, ErrorState, Badge } from '../../../components/ui/index.js';
import { useFetch } from '../../../hooks/useFetch.js';
import { exportCsv } from '../../../lib/csv.js';
import { mediaUrl, onImageError, FALLBACK_IMAGE } from '../../../lib/utils.js';

const MEDALS = ['#f5b638', '#b0b0b0', '#cd7f32'];

export default function AuthorityTopVillages() {
  const { t } = useTranslation();
  const [region, setRegion] = useState('');
  const { data: regions } = useFetch('/stats/regions');
  const { data, loading, error, refetch } = useFetch('/stats/villages/top', {
    params: region ? { region } : {},
    deps: [region],
  });
  const rows = data ?? [];

  const csv = () =>
    exportCsv('top-villages', [
      { key: 'rank', header: 'Rank', value: (_r) => rows.indexOf(_r) + 1 },
      { key: 'name', header: 'Village' }, { key: 'region', header: 'Region' },
      { key: 'ratingAverage', header: 'Rating' }, { key: 'ratingCount', header: 'Reviews' },
    ], rows);

  return (
    <div>
      <PageHeader
        title={t('dash.nav.topVillages')}
        actions={
          <>
            <div className="w-48">
              <Select value={region} onChange={(e) => setRegion(e.target.value)}
                options={[{ value: '', label: t('dash.authority.allRegions') }, ...(regions ?? []).map((r) => ({ value: r.region, label: r.region }))]} />
            </div>
            <Button variant="outline" onClick={csv} disabled={!rows.length}><Download size={16} /> {t('dash.common.exportCsv')}</Button>
          </>
        }
      />

      {error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : loading ? (
        <div className="space-y-3">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-card" />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState icon={Trophy} title={t('dash.authority.noTop')} />
      ) : (
        <ol className="space-y-3">
          {rows.map((v, i) => (
            <Card as="li" key={v._id} className="flex items-center gap-4 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-body-lg font-bold text-white"
                style={{ background: MEDALS[i] ?? '#c9c9c9' }}>{i + 1}</span>
              <img src={mediaUrl(v.coverImage) || FALLBACK_IMAGE} alt="" onError={onImageError} className="h-14 w-20 shrink-0 rounded-card object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-h3 text-primary">{v.name}</p>
                <p className="inline-flex items-center gap-1 text-small text-ink/50"><MapPin size={13} /> {v.region}{v.province ? `, ${v.province}` : ''}</p>
              </div>
              <div className="shrink-0 text-right">
                <Rating value={v.ratingAverage} showValue size={16} />
                <Badge tone="neutral" className="mt-1">{t('card.reviewsCount', { count: v.ratingCount })}</Badge>
              </div>
            </Card>
          ))}
        </ol>
      )}
    </div>
  );
}
