import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../lib/utils.js';

const ToastContext = createContext(null);

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info };
const TONES = {
  success: 'border-l-primary text-primary',
  error: 'border-l-red-500 text-red-500',
  info: 'border-l-cta text-cta',
};

/**
 * Global toast notifications. Any component calls `toast.success(msg)` /
 * `toast.error(msg)` after a mutation. Toasts auto-dismiss after 4s.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (type, message) => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, type, message }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  const toast = useMemo(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {createPortal(
        <div className="fixed bottom-4 right-4 z-[60] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
          {toasts.map((tt) => {
            const Icon = ICONS[tt.type];
            return (
              <div
                key={tt.id}
                role="status"
                className={cn(
                  'flex items-start gap-3 rounded-card border-l-4 bg-white p-3 shadow-card',
                  TONES[tt.type]
                )}
              >
                <Icon size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
                <p className="flex-1 text-small text-ink">{tt.message}</p>
                <button
                  type="button"
                  onClick={() => dismiss(tt.id)}
                  aria-label="Dismiss"
                  className="shrink-0 text-ink/40 hover:text-ink"
                >
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
