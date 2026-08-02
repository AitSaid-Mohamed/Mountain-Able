import { cn } from '../../lib/utils.js';

/** Read-only labelled field: icon + label above, value below. Two per row. */
export default function FieldRow({ icon: Icon, label, value, className }) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="mb-1 flex items-center gap-2 text-[15px] text-[#808080]">
        {Icon && <Icon size={18} aria-hidden="true" />}
        {label}
      </div>
      <div className="truncate text-[15px] text-ink">{value || '—'}</div>
    </div>
  );
}
