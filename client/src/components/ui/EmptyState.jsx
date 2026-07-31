import { Inbox } from 'lucide-react';
import { cn } from '../../lib/utils.js';

/** Friendly empty-state block with an icon, message and optional action. */
export default function EmptyState({ icon: Icon = Inbox, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon size={28} aria-hidden="true" />
      </div>
      <h3 className="text-h3 text-ink">{title}</h3>
      {description && <p className="mt-2 max-w-md text-body text-ink/60">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
