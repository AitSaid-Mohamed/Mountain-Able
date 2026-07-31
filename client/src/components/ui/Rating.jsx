import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '../../lib/utils.js';

const FILL = '#f5b638';
const EMPTY = '#d1d1d1';

/**
 * Star rating. Read-only mode renders the (possibly fractional) average with an
 * optional numeric value and review count. Interactive mode (`onChange`) lets
 * the user pick 1–5 stars for the review form.
 */
export default function Rating({
  value = 0,
  count,
  onChange,
  size = 18,
  showValue = false,
  className,
  interactive = false,
}) {
  const [hover, setHover] = useState(0);
  const active = hover || value;

  if (interactive) {
    return (
      <div className={cn('inline-flex items-center gap-1', className)} role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(n)}
            className="rounded p-0.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <Star
              size={size + 8}
              fill={n <= active ? FILL : 'none'}
              color={n <= active ? FILL : EMPTY}
            />
          </button>
        ))}
      </div>
    );
  }

  // Read-only display with fractional fill via width clipping.
  const pct = Math.max(0, Math.min(5, value)) / 5;
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="relative inline-flex" aria-hidden="true">
        <span className="inline-flex">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} size={size} fill="none" color={EMPTY} />
          ))}
        </span>
        <span
          className="absolute left-0 top-0 inline-flex overflow-hidden"
          style={{ width: `${pct * 100}%` }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} size={size} fill={FILL} color={FILL} className="shrink-0" />
          ))}
        </span>
      </span>
      {showValue && (
        <span className="text-small font-semibold text-ink">
          {value ? value.toFixed(1) : '—'}
        </span>
      )}
      {count !== undefined && (
        <span className="text-small text-ink/50">({count})</span>
      )}
    </span>
  );
}
