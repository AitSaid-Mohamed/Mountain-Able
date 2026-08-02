import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Mountain, Building2, Map as MapIcon, Users, MessageSquare, Star } from 'lucide-react';
import { PageHeader, Panel } from '../../../components/dashboard/index.js';
import { StatCard, Skeleton, ErrorState } from '../../../components/ui/index.js';
import { useFetch } from '../../../hooks/useFetch.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AuthorityOverview() {
  const { t } = useTranslation();
  const { data: ov, loading, error, refetch } = useFetch('/stats/overview');
  const { data: regions } = useFetch('/stats/regions');
  const { data: satisfaction } = useFetch('/stats/satisfaction');

  const stats = [
    { icon: Mountain, label: t('dash.stat.villagesTracked'), value: ov?.villages },
    { icon: Building2, label: t('dash.stat.municipalities'), value: ov?.municipalities },
    { icon: MapIcon, label: t('dash.stat.regionsMonitored'), value: regions?.length },
    { icon: Users, label: t('dash.stat.tourists'), value: ov?.tourists },
    { icon: MessageSquare, label: t('dash.stat.reviewsAnalysed'), value: ov?.comments },
    { icon: Star, label: t('dash.stat.avgRating'), value: ov?.averageRating },
  ];

  const monthly = (satisfaction?.monthly ?? []).map((m) => ({ ...m, label: `${MONTHS[m.month - 1]} ${String(m.year).slice(2)}` }));

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div>
      <PageHeader title={t('dash.nav.overview')} />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s, i) =>
          loading ? <Skeleton key={i} className="h-20 rounded-card" /> : <StatCard key={i} icon={s.icon} value={s.value ?? 0} label={s.label} />
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel icon={Mountain} title={t('dash.authority.villagesPerRegion')}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regions ?? []} margin={{ top: 8, right: 8, bottom: 40, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="region" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 11, fill: '#808080' }} height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#808080' }} />
                <Tooltip />
                <Bar dataKey="villageCount" name={t('dash.nav.villages')} fill="#21bf73" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel icon={MessageSquare} title={t('dash.authority.reviewVolume')}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#808080' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#808080' }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" name={t('dash.authority.reviewCount')} stroke="#25d366" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </div>
  );
}
