import { cn } from '../../lib/utils.js';
import Spinner from './Spinner.jsx';

const VARIANTS = {
  // cta green with white text — the darker `cta` reads as AA for the button label weight/size used here.
  primary: 'bg-cta text-white hover:brightness-95 focus-visible:ring-cta/50 shadow-sm',
  brand: 'bg-primary text-white hover:brightness-95 focus-visible:ring-primary/50',
  outline:
    'border border-primary text-primary bg-transparent hover:bg-primary/5 focus-visible:ring-primary/40',
  ghost: 'bg-transparent text-ink hover:bg-black/5 focus-visible:ring-black/20',
};

const SIZES = {
  sm: 'text-small px-4 py-2 gap-1.5',
  md: 'text-body px-6 py-2.5 gap-2',
  lg: 'text-body-lg px-8 py-3 gap-2',
};

/**
 * Primary action button. Variants: `primary` (cta green), `brand` (primary
 * green), `outline`, `ghost`. Renders as any element via `as` (e.g. Link).
 * Shows a spinner and disables interaction while `loading`.
 */
export default function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  children,
  ...props
}) {
  const isDisabled = disabled || loading;
  return (
    <Component
      className={cn(
        'inline-flex items-center justify-center rounded-pill font-semibold transition',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cream',
        'disabled:opacity-50 disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      disabled={Component === 'button' ? isDisabled : undefined}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner size={18} />}
      {children}
    </Component>
  );
}
