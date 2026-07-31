import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils.js';

const SIZES = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

/**
 * Accessible modal dialog rendered in a portal. Closes on Escape and backdrop
 * click, traps Tab focus inside, blurs the backdrop, and restores focus to the
 * element that opened it.
 */
export default function Modal({ open, onClose, title, children, size = 'md', className }) {
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);

  const handleKey = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return undefined;
    triggerRef.current = document.activeElement;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKey);
    // Focus the first focusable element inside the dialog.
    const t = setTimeout(() => {
      const el = dialogRef.current?.querySelector(
        'input, textarea, button, a[href], select, [tabindex]'
      );
      el?.focus();
    }, 0);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKey);
      clearTimeout(t);
      triggerRef.current?.focus?.();
    };
  }, [open, handleKey]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative z-10 w-full rounded-card bg-white shadow-card',
          'max-h-[90vh] overflow-y-auto',
          SIZES[size],
          className
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-1.5 text-ink/60 transition hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <X size={20} />
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}
