import { Link } from 'react-router-dom';
import { Mountain } from 'lucide-react';
import { cn } from '../../lib/utils.js';

/** Wordmark: a mountain glyph + the platform name. */
export default function Logo({ to = '/', className, tone = 'primary' }) {
  const color = tone === 'white' ? 'text-white' : 'text-primary';
  return (
    <Link
      to={to}
      className={cn('inline-flex items-center gap-2 font-semibold', color, className)}
      aria-label="Mountain-Able home"
    >
      <Mountain size={28} aria-hidden="true" />
      <span className={cn('text-h3', tone === 'white' ? 'text-white' : 'text-ink')}>
        Mountain-<span className={color}>Able</span>
      </span>
    </Link>
  );
}
