import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils.js';

/** Build a compact page list with ellipses for large ranges. */
function pageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push('…');
    out.push(p);
    prev = p;
  }
  return out;
}

/**
 * Pagination (Figma 12:177): circular 44px buttons filled with the brand
 * green, the active page in a darker shade, chevrons on either side, disabled
 * at the bounds.
 */
export default function Pagination({ page, totalPages, onChange }) {
  const { t } = useTranslation();
  if (totalPages <= 1) return null;

  const btn =
    'flex h-11 w-11 items-center justify-center rounded-full text-body font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50';

  return (
    <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label={t('villages.prevPage')}
        className={cn(btn, 'bg-primary text-white hover:brightness-95 disabled:opacity-40 disabled:pointer-events-none')}
      >
        <ChevronLeft size={20} />
      </button>

      {pageList(page, totalPages).map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="px-1 text-ink/40">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              btn,
              p === page
                ? 'bg-[#178a53] text-white'
                : 'bg-primary text-white hover:brightness-95'
            )}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label={t('villages.nextPage')}
        className={cn(btn, 'bg-primary text-white hover:brightness-95 disabled:opacity-40 disabled:pointer-events-none')}
      >
        <ChevronRight size={20} />
      </button>
    </nav>
  );
}
