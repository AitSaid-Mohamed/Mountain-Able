import { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';
import { cn } from '../../lib/utils.js';

/**
 * Kebab dropdown of row actions for tables.
 * @param {Array<{label, icon, onClick, danger?, disabled?}>} items
 */
export default function RowActions({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Row actions"
        className="rounded-md p-1.5 text-ink/60 transition hover:bg-black/5"
      >
        <MoreVertical size={18} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-30 mt-1 w-52 overflow-hidden rounded-card bg-white py-1 shadow-card">
          {items.filter(Boolean).map((it, i) => (
            <button
              key={i}
              type="button"
              role="menuitem"
              disabled={it.disabled}
              onClick={() => { setOpen(false); it.onClick(); }}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-2.5 text-left text-small transition hover:bg-black/5 disabled:opacity-40',
                it.danger ? 'text-red-600' : 'text-ink/80'
              )}
            >
              {it.icon && <it.icon size={16} aria-hidden="true" />}
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
