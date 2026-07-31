import Card from './Card.jsx';
import { cn } from '../../lib/utils.js';

/** KPI tile: icon, big value, label, optional delta/subtext. */
export default function StatCard({ icon: Icon, label, value, sub, className }) {
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
