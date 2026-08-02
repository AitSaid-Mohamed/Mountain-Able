import { cn } from '../../lib/utils.js';

/**
 * Dashboard page header: a 35px title, optional pill tabs, and optional actions
 * on the right (e.g. an "Add village" button).
 *
 * @param {Array<{key:string,label:string}>} [tabs]
 */
export default function PageHeader({ title, tabs, activeTab, onTab, actions, className }) {
  return (
    <div className={cn('mb-6 flex flex-wrap items-center gap-4', className)}>
      <h1 className="text-[35px] font-medium leading-tight text-ink">{title}</h1>
      {tabs && (
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTab(tab.key)}
              className={cn(
                'rounded-pill px-[15px] py-1.5 text-[15px] font-medium transition',
                activeTab === tab.key ? 'bg-cta text-[#f3f4f4]' : 'bg-[#f2efef] text-ink hover:bg-[#e8e4e4]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
      {actions && <div className="ml-auto flex items-center gap-3">{actions}</div>}
    </div>
  );
}
