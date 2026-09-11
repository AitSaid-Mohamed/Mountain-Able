import { useTranslation } from 'react-i18next';
import { Download, TriangleAlert, Handshake, Clock, MapPinOff } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { PageHeader, Panel } from '../../../components/dashboard/index.js';
import { Button, Badge, Skeleton, ErrorState, EmptyState } from '../../../components/ui/index.js';
import ServiceIcon from '../../../components/coordination/ServiceIcon.jsx';
import { useFetch } from '../../../hooks/useFetch.js';
import { exportCsv } from '../../../lib/csv.js';
import { cn } from '../../../lib/utils.js';

/**
 * The territorial picture the coordination record produces.
 *
 * Every request permanently records what was sought, where, and whether it was
 * met — evidence no single municipality can generate, because it only exists
 * once requests pool across the territory. This screen is the reason the feature
 * is more than a message board.
 *
 * Read-only throughout, like the rest of the authority role.
 */
export default function AuthorityCoordination() {
  const { t } = useTranslation();
  const overview = useFetch('/coordination/stats/overview');
  const gaps = useFetch('/coordination/stats/gaps');
  const demand = useFetch('/coordination/stats/demand');
  const coverage = useFetch('/coordination/stats/coverage');
  const engagement = useFetch('/coordination/stats/engagement');
  const isolation = useFetch('/coordination/stats/isolation');

  if (overview.error) return <ErrorState error={overview.error} onRetry={overview.refetch} />;

  const ov = overview.data;
  const minN = ov?.minN ?? 5;

  return (
    <div className="space-y-8">
      <PageHeader title={t('dash.nav.coordination')} />
      <p className="-mt-4 max-w-3xl text-body text-ink/70">{t('coord.authority.intro')}</p>

      {/* KPIs — counts always, rates only when they mean something. */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label={t('coord.authority.kpiRequests')} value={ov?.requests} loading={overview.loading} />
        <Kpi label={t('coord.authority.kpiFulfilment')}
          value={ov ? (ov.fulfilmentRate == null ? t('coord.authority.tooFew', { n: minN }) : `${ov.fulfilmentRate}%`) : null}
          sub={ov ? t('coord.authority.ofDecided', { decided: ov.decided }) : null}
          loading={overview.loading} />
        <Kpi label={t('coord.authority.kpiDeclaring')}
          value={ov ? `${ov.declaringMunicipalities} / ${ov.totalMunicipalities}` : null}
          loading={overview.loading} />
        <Kpi label={t('coord.authority.kpiCapabilities')} value={ov?.capabilities} loading={overview.loading} />
      </div>

      {/* Priorities: sought repeatedly, offered by nobody. */}
      <Panel icon={TriangleAlert} title={t('coord.authority.gapsTitle')}
        action={
          gaps.data?.length ? (
            <Button size="sm" variant="outline" onClick={() => exportCsv('coordination-gaps',
              [
                { key: 'name', label: t('coord.authority.service') },
                { key: 'requests', label: t('coord.authority.requests') },
                { key: 'notMet', label: t('coord.authority.notMet') },
                { key: 'providers', label: t('coord.authority.providers') },
                { key: 'coveragePercent', label: t('coord.authority.coverage') },
              ],
              gaps.data.map((r) => ({ ...r, name: r.serviceType.name })))}>
              <Download size={15} /> {t('coord.authority.exportCsv')}
            </Button>
          ) : null
        }>
        <p className="mb-4 text-body text-ink/70">{t('coord.authority.gapsHint')}</p>
        {gaps.loading ? <Skeleton className="h-64 rounded-card" /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-body">
              <thead>
                <tr className="border-b border-ink/10 text-small text-ink/60">
                  <th className="py-2 pr-4">{t('coord.authority.service')}</th>
                  <th className="py-2 pr-4 text-right">{t('coord.authority.requests')}</th>
                  <th className="py-2 pr-4 text-right">{t('coord.authority.notMet')}</th>
                  <th className="py-2 pr-4 text-right">{t('coord.authority.providers')}</th>
                  <th className="py-2 text-right">{t('coord.authority.coverage')}</th>
                </tr>
              </thead>
              <tbody>
                {(gaps.data ?? []).map((r) => (
                  <tr key={r.serviceType._id} className={cn('border-b border-ink/5', r.isPriority && 'bg-amber-50/60')}>
                    <td className="py-2.5 pr-4">
                      <span className="flex items-center gap-2">
                        <ServiceIcon name={r.serviceType.icon} size={15} className="shrink-0 text-primary" aria-hidden="true" />
                        {r.serviceType.name}
                        {r.isPriority && <Badge tone="amber">{t('coord.authority.priority')}</Badge>}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-right">{r.requests}</td>
                    <td className={cn('py-2.5 pr-4 text-right', r.notMet > 0 && 'font-semibold text-[#9a6b00]')}>{r.notMet}</td>
                    <td className="py-2.5 pr-4 text-right">{r.providers}</td>
                    <td className="py-2.5 text-right">{r.coveragePercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Unmet demand by service, ranked. */}
      <Panel icon={Handshake} title={t('coord.authority.demandTitle')}>
        <p className="mb-4 text-body text-ink/70">{t('coord.authority.demandHint')}</p>
        {demand.loading ? <Skeleton className="h-64 rounded-card" /> :
          (demand.data ?? []).length === 0 ? (
            <EmptyState title={t('coord.authority.noRequests')} description={t('coord.authority.noRequestsHint')} />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={(demand.data ?? []).slice(0, 8).map((r) => ({
                name: r.serviceType.name, notMet: r.notMet, fulfilled: r.fulfilled,
              }))} margin={{ top: 8, right: 8, left: 8, bottom: 64 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
                <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 12 }} height={72} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="fulfilled" stackId="a" fill="#21bf73" name={t('coord.status.fulfilled')} />
                <Bar dataKey="notMet" stackId="a" fill="#f5b638" name={t('coord.authority.notMet')} />
              </BarChart>
            </ResponsiveContainer>
          )}
      </Panel>

      {/* Coverage matrix: structural gaps, visible before anyone asks. */}
      <Panel icon={Handshake} title={t('coord.authority.coverageTitle')}>
        <p className="mb-4 text-body text-ink/70">{t('coord.authority.coverageHint')}</p>
        {coverage.loading ? <Skeleton className="h-72 rounded-card" /> : <CoverageMatrix data={coverage.data} />}
      </Panel>

      {/* Engagement: no capacity, or no participation? */}
      <Panel icon={Clock} title={t('coord.authority.engagementTitle')}>
        <p className="mb-4 text-body text-ink/70">{t('coord.authority.engagementHint')}</p>
        {engagement.loading ? <Skeleton className="h-32 rounded-card" /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-body">
              <thead>
                <tr className="border-b border-ink/10 text-small text-ink/60">
                  <th className="py-2 pr-4">{t('dash.common.region')}</th>
                  <th className="py-2 pr-4 text-right">{t('coord.authority.requests')}</th>
                  <th className="py-2 pr-4 text-right">{t('coord.authority.withResponse')}</th>
                  <th className="py-2 pr-4 text-right">{t('coord.authority.responseRate')}</th>
                  <th className="py-2 text-right">{t('coord.authority.medianFirst')}</th>
                </tr>
              </thead>
              <tbody>
                {(engagement.data ?? []).map((r) => (
                  <tr key={r.region} className="border-b border-ink/5">
                    <td className="py-2.5 pr-4">{r.region}</td>
                    <td className="py-2.5 pr-4 text-right">{r.requests}</td>
                    <td className="py-2.5 pr-4 text-right">{r.withAnyResponse}</td>
                    <td className="py-2.5 pr-4 text-right">
                      {r.responseRate == null
                        ? <span className="text-small text-ink/45">{t('coord.authority.tooFew', { n: minN })}</span>
                        : `${r.responseRate}%`}
                    </td>
                    <td className="py-2.5 text-right">
                      {r.medianHoursToFirstResponse == null ? '—' : t('coord.hours', { count: r.medianHoursToFirstResponse })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Isolation: comuni for which coordination is not an available strategy. */}
      <Panel icon={MapPinOff} title={t('coord.authority.isolationTitle')}>
        <p className="mb-4 text-body text-ink/70">{t('coord.authority.isolationHint')}</p>
        {isolation.loading ? <Skeleton className="h-40 rounded-card" /> : (
          <ul className="space-y-2">
            {(isolation.data ?? []).filter((m) => m.isIsolated).map((m) => (
              <li key={m._id} className="flex flex-wrap items-center justify-between gap-2 rounded-card bg-amber-50/60 px-4 py-2.5">
                <span className="text-body text-ink">{m.name}</span>
                <span className="text-small text-ink/60">{m.region} · {t('coord.authority.noDeclaringNeighbour')}</span>
              </li>
            ))}
            {(isolation.data ?? []).every((m) => !m.isIsolated) && (
              <li className="text-body text-ink/60">{t('coord.authority.noneIsolated')}</li>
            )}
          </ul>
        )}
      </Panel>

      <p className="text-small text-ink/55">{t('coord.authority.smallNumbers', { n: minN })}</p>
    </div>
  );
}

function Kpi({ label, value, sub, loading }) {
  return (
    <div className="rounded-card bg-white p-5 shadow-card">
      <p className="text-small text-ink/60">{label}</p>
      {loading ? <Skeleton className="mt-2 h-8 w-20" /> : (
        <p className="mt-1 text-h2 text-ink">{value ?? '—'}</p>
      )}
      {sub && <p className="mt-1 text-small text-ink/50">{sub}</p>}
    </div>
  );
}

/** Service type × region. An empty cell is the finding, so it is styled as one. */
function CoverageMatrix({ data }) {
  const { t } = useTranslation();
  if (!data) return null;
  const { serviceTypes = [], regions = [], cells = [], municipalitiesByRegion = [] } = data;
  const at = new Map(cells.map((c) => [`${c.region}|${c.serviceTypeId}`, c.count]));
  const total = new Map(municipalitiesByRegion.map((r) => [r.region, r.municipalities]));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] border-separate border-spacing-0 text-left text-small">
        <thead>
          <tr>
            <th className="sticky left-0 bg-canvas py-2 pr-3 text-ink/60">{t('coord.authority.service')}</th>
            {regions.map((r) => (
              <th key={r} className="px-2 py-2 text-center align-bottom text-ink/60">
                <span className="block">{r}</span>
                <span className="block text-[11px] font-normal text-ink/40">
                  {t('coord.authority.ofN', { n: total.get(r) ?? 0 })}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {serviceTypes.map((s) => (
            <tr key={s._id}>
              <td className="sticky left-0 bg-canvas py-1.5 pr-3 text-ink">
                <span className="flex items-center gap-2">
                  <ServiceIcon name={s.icon} size={14} className="shrink-0 text-primary" aria-hidden="true" />
                  {s.name}
                </span>
              </td>
              {regions.map((r) => {
                const n = at.get(`${r}|${s._id}`) ?? 0;
                return (
                  <td key={r} className="px-2 py-1.5 text-center">
                    <span className={cn(
                      'inline-flex h-7 w-7 items-center justify-center rounded-card text-small font-medium',
                      n === 0 ? 'bg-black/[0.04] text-ink/30' : 'bg-primary/15 text-primary'
                    )}>
                      {n === 0 ? '·' : n}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
