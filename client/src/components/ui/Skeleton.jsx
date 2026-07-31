import { cn } from '../../lib/utils.js';

/** Shimmering placeholder block for loading states. */
export default function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-md bg-black/10', className)} aria-hidden="true" />;
}
