import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Map as MapIcon, Download } from 'lucide-react';
import { PageHeader, Panel } from '../../../components/dashboard/index.js';
import { DataTable, Rating, Button } from '../../../components/ui/index.js';
import { useFetch } from '../../../hooks/useFetch.js';
import { exportCsv } from '../../../lib/csv.js';

export default function AuthorityRegions() {
  const { t } = useTranslation();
  const { data, loading, error, refetch } = useFetch('/stats/regions');
  const rows = data ?? [];

  const columns = [
    { key: 'region', header: t('dash.common.region'), sortable: true, render: (r) => <span className="font-medium text-ink">{r.region}</span> },
    { key: 'villageCount', header: t('dash.nav.villages'), sortable: true, className: 'text-center' },
    { key: 'avgRating', header: t('dash.authority.avgRating'), sortable: true, render: (r) => <Rating value={r.avgRating} showValue size={14} /> },
    { key: 'totalComments', header: t('dash.common.reviews'), sortable: true, className: 'text-center' },
    { key: 'totalAttractions', header: t('dash.common.attractions'), sortable: true, className: 'text-center' },
  ];

  const csv = () =>
    exportCsv('regions', [
      { key: 'region', header: 'Region' }, { key: 'villageCount', header: 'Villages' },
      { key: 'avgRating', header: 'Avg rating' }, { key: 'totalComments', header: 'Reviews' }, { key: 'totalAttractions', header: 'Attractions' },
    ], rows);

  return (
    <div>
      <PageHeader title={t('dash.nav.regions')} actions={<Button variant="outline" onClick={csv} disabled={!rows.length}><Download size={16} /> {t('dash.common.exportCsv')}</Button>} />

      <Panel icon={MapIcon} title={t('dash.authority.avgRatingByRegion')} className="mb-6">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={rows} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11, fill: '#808080' }} />
              <YAxis type="category" dataKey="region" width={140} tick={{ fontSize: 11, fill: '#808080' }} />
              <Tooltip />
              <Bar dataKey="avgRating" name={t('dash.authority.avgRating')} fill="#f5b638" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <DataTable columns={columns} rows={rows} loading={loading} error={error} onRetry={refetch} pageSize={15} rowKey={(r) => r.region} />
    </div>
  );
}
