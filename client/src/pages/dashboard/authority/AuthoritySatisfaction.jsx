import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Smile, TrendingUp, Map as MapIcon, Download } from 'lucide-react';
import { PageHeader, Panel } from '../../../components/dashboard/index.js';
import { Button, Skeleton, ErrorState } from '../../../components/ui/index.js';
import { useFetch } from '../../../hooks/useFetch.js';
import { exportCsv } from '../../../lib/csv.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AuthoritySatisfaction() {
  const { t } = useTranslation();
  const { data, loading, error, refetch } = useFetch('/stats/satisfaction');
  const { data: regions } = useFetch('/stats/regions');

  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (loading || !data) {
    return (
      <div>
        <PageHeader title={t('dash.nav.satisfaction')} />
        <div className="grid gap-6 lg:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-72 rounded-card" />)}</div>
      </div>
    );
  }

  const distribution = data.distribution.map((d) => ({ ...d, label: `${d.rating}★` }));
  const monthly = data.monthly.map((m) => ({ ...m, label: `${MONTHS[m.month - 1]} ${String(m.year).slice(2)}` }));

  return (
    <div>
      <PageHeader
        title={t('dash.nav.satisfaction')}
        actions={<Button variant="outline" onClick={() => exportCsv('satisfaction-monthly',
          [{ key: 'year', header: 'Year' }, { key: 'month', header: 'Month' }, { key: 'count', header: 'Reviews' }, { key: 'avgRating', header: 'Avg rating' }], data.monthly)}>
          <Download size={16} /> {t('dash.common.exportCsv')}</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel icon={Smile} title={t('dash.authority.distribution')}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#808080' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#808080' }} />
                <Tooltip />
                <Bar dataKey="count" name={t('dash.common.reviews')} fill="#f5b638" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel icon={TrendingUp} title={t('dash.authority.monthlyTrend')}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#808080' }} />
                <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 11, fill: '#808080' }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 5]} tick={{ fontSize: 11, fill: '#808080' }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="count" name={t('dash.authority.reviewCount')} stroke="#25d366" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="avgRating" name={t('dash.authority.avgRating')} stroke="#21bf73" strokeWidth={2} strokeDasharray="4 3" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel icon={MapIcon} title={t('dash.authority.avgRatingByRegion')} className="lg:col-span-2">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regions ?? []} margin={{ top: 8, right: 8, bottom: 50, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="region" angle={-35} textAnchor="end" interval={0} height={70} tick={{ fontSize: 11, fill: '#808080' }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: '#808080' }} />
                <Tooltip />
                <Bar dataKey="avgRating" name={t('dash.authority.avgRating')} fill="#21bf73" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </div>
  );
}
