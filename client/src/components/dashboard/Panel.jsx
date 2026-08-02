import { cn } from '../../lib/utils.js';

/**
 * White rounded panel with an icon + title header, a full-width divider, then
 * content — the recurring container on the dashboard screens.
 */
export default function Panel({ icon: Icon, title, action, className, bodyClassName, children }) {
  return (
    <section className={cn('rounded-card bg-white shadow-[0px_2px_10px_0px_rgba(0,0,0,0.15)]', className)}>
      <div className="flex items-center gap-3 px-5 py-4">
        {Icon && <Icon size={26} className="shrink-0 text-cta" aria-hidden="true" />}
        <h2 className="flex-1 text-[20px] font-medium text-ink">{title}</h2>
        {action}
      </div>
      <div className="border-t border-ink/10" />
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </section>
  );
}
