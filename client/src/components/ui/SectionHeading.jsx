import { cn } from '../../lib/utils.js';

/**
 * Section heading with a thin horizontal rule filling the remaining width and
 * an optional action on the far right (e.g. a "See more →" link). Used on the
 * Home and Villages pages for a consistent section rhythm.
 */
export default function SectionHeading({ children, action, as: Tag = 'h2', className }) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      {/* min-w-0 lets long headings wrap instead of forcing horizontal overflow */}
      <Tag className="min-w-0 text-h1 text-ink">{children}</Tag>
      <span className="hidden h-px flex-1 bg-ink/15 sm:block" aria-hidden="true" />
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
