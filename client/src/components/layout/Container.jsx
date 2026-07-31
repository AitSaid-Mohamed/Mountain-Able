import { cn } from '../../lib/utils.js';

/** Centered page container: max 1336px with responsive side gutters. */
export default function Container({ as: Tag = 'div', className, children }) {
  return (
    <Tag className={cn('mx-auto w-full max-w-container px-4 md:px-8 lg:px-13', className)}>
      {children}
    </Tag>
  );
}
