import { cn } from '../../lib/utils.js';

const TONES = {
  primary: 'bg-primary/10 text-primary',
  neutral: 'bg-black/5 text-ink/70',
  amber: 'bg-[#f5b638]/15 text-[#9a6b00]',
};

/** Small pill label, optionally with a leading icon. */
export default function Badge({ tone = 'primary', icon: Icon, className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill px-3 py-1 text-small font-medium',
        TONES[tone],
        className
      )}
    >
      {Icon && <Icon size={14} aria-hidden="true" />}
      {children}
    </span>
  );
}
