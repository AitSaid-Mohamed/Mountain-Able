import { useTranslation } from 'react-i18next';
import { AlertTriangle, TriangleAlert, Info, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils.js';

const SEVERITY = {
  high: { icon: AlertTriangle, cls: 'border-l-red-500 bg-red-50 text-red-700' },
  medium: { icon: TriangleAlert, cls: 'border-l-amber-500 bg-amber-50 text-amber-800' },
  low: { icon: Info, cls: 'border-l-cta bg-cta/5 text-ink/80' },
  info: { icon: ShieldCheck, cls: 'border-l-ink/30 bg-black/[0.03] text-ink/70' },
};
const RANK = { high: 3, medium: 2, low: 1, info: 0 };

/**
 * Renders derived advisories, most significant first. Text is translated from
 * the structured descriptor, and each advisory carries a provenance line so its
 * basis and uncertainty are explicit.
 */
export default function AdvisoryList({ advisories = [] }) {
  const { t } = useTranslation();
  if (advisories.length === 0) {
    return <p className="text-body text-ink/50">{t('route.advisories.none')}</p>;
  }
  const sorted = [...advisories].sort((a, b) => RANK[b.severity] - RANK[a.severity]);

  return (
    <ul className="space-y-3">
      {sorted.map((a, i) => {
        const sev = SEVERITY[a.severity] ?? SEVERITY.info;
        const Icon = sev.icon;
        const params = { ...a.params, surfaces: Array.isArray(a.params?.surfaces) ? a.params.surfaces.join(', ') : a.params?.surfaces };
        return (
          <li key={i} className={cn('rounded-card border-l-4 p-3', sev.cls)}>
            <div className="flex gap-2">
              <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-small font-medium">{t(`route.adv.${a.type}`, params)}</p>
                <p className="mt-1 text-[12px] italic opacity-70">{t(`route.provenance.${a.provenance}`)}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
