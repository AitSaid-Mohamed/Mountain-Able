import { NavLink } from 'react-router-dom';
import { Mountain } from 'lucide-react';
import { cn } from '../../lib/utils.js';

/**
 * Vertical dashboard navigation. `items` is an array of
 * `{ to, label, icon }`. Shared by the officer/admin/authority dashboards
 * (built in the next step) so their chrome is consistent.
 */
export default function DashboardSidebar({ items = [], title }) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-ink/10 bg-white">
      <div className="flex items-center gap-2 px-5 py-5 text-primary">
        <Mountain size={24} />
        <span className="font-semibold text-ink">{title}</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-card px-3 py-2.5 text-body transition',
                isActive ? 'bg-primary/10 font-semibold text-primary' : 'text-ink/70 hover:bg-black/5'
              )
            }
          >
            {Icon && <Icon size={18} aria-hidden="true" />}
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
