import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, CornerUpLeft } from 'lucide-react';
import { formatDistance, cn } from '../../lib/utils.js';

/** Compose a readable, translated instruction from an OSRM step descriptor. */
function instruction(step, t) {
  const name = step.name ? t('route.step.onto', { name: step.name }) : '';
  const dir = step.modifier ? t(`route.dir.${step.modifier}`, { defaultValue: step.modifier }) : '';
  switch (step.type) {
    case 'depart': return t('route.step.depart', { name });
    case 'arrive': return t('route.step.arrive');
    case 'roundabout':
    case 'rotary': return t('route.step.roundabout', { name });
    case 'merge': return t('route.step.merge', { name });
    case 'fork': return t('route.step.fork', { dir, name });
    case 'turn':
    case 'end of road':
    case 'new name':
    case 'continue':
      return dir ? t('route.step.turn', { dir, name }) : t('route.step.continue', { name });
    default:
      return t('route.step.continue', { name });
  }
}

/** Turn-by-turn step list, collapsed by default (reference, not navigation). */
export default function DirectionsList({ steps = [] }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-card bg-black/[0.03] px-4 py-2.5 text-body font-medium text-ink"
      >
        {open ? t('route.directions.hide') : t('route.directions.show')}
        <ChevronDown size={18} className={cn('transition', open && 'rotate-180')} />
      </button>
      {open && (
        <ol className="mt-3 space-y-2">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-small">
              <CornerUpLeft size={15} className="mt-0.5 shrink-0 text-ink/30" aria-hidden="true" />
              <span className="flex-1 text-ink/80">{instruction(s, t)}</span>
              {s.distance > 0 && <span className="shrink-0 text-ink/40">{formatDistance(s.distance)}</span>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
