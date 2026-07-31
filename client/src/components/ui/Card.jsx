import { cn } from '../../lib/utils.js';

/** White rounded card with the design-system shadow. */
export default function Card({ as: Component = 'div', className, children, ...props }) {
  return (
    <Component
      className={cn('bg-white rounded-card shadow-card', className)}
      {...props}
    >
      {children}
    </Component>
  );
}
