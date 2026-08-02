import Card from './Card.jsx';
import { cn } from '../../lib/utils.js';

/**
 * KPI tile. Two layouts:
 *  - `row` (default): icon left, value + label right — used on public/compact areas.
 *  - `tile`: centred icon / value / label, ~153px tall — the dashboard treatment
 *    from the Figma profile screen.
 */
export default function StatCard({ icon: Icon, label, value, sub, layout = 'row', className }) {
  if (layout === 'tile') {
    return (
      <Card
        className={cn(
          'flex min-h-[153px] flex-col items-center justify-center gap-1 p-5 text-center drop-shadow-[0px_2px_5px_rgba(0,0,0,0.15)]',
          className
        )}
      >
        {Icon && <Icon size={30} className="text-cta" aria-hidden="true" />}
        <div className="mt-2 text-[30px] font-normal leading-none text-ink">{value}</div>
        <div className="text-[15px] font-light text-ink/60">{label}</div>
        {sub && <div className="text-small text-primary">{sub}</div>}
      </Card>
    );
  }

  return (
    <Card className={cn('flex items-center gap-4 p-5', className)}>
      {Icon && (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-card bg-primary/10 text-primary">
          <Icon size={24} aria-hidden="true" />
        </div>
      )}
      <div className="min-w-0">
        <div className="text-h2 leading-none text-ink">{value}</div>
        <div className="mt-1 truncate text-small text-ink/60">{label}</div>
        {sub && <div className="text-small text-primary">{sub}</div>}
      </div>
    </Card>
  );
}
