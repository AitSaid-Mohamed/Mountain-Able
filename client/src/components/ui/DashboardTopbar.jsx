import { cn } from '../../lib/utils.js';

/**
 * Dashboard top bar: page title on the left, arbitrary actions on the right
 * (e.g. a "New village" button or the user menu). Shared chrome for all
 * dashboards.
 */
export default function DashboardTopbar({ title, subtitle, actions, className }) {
  return (
    <header
      className={cn(
        'flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 bg-white px-6 py-4',
        className
      )}
    >
      <div>
        <h1 className="text-h2 text-ink">{title}</h1>
        {subtitle && <p className="text-small text-ink/60">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}
