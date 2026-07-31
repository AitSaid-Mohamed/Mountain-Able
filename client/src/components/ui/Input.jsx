import { forwardRef, useId } from 'react';
import { cn } from '../../lib/utils.js';

/**
 * Text input with an always-visible label (placeholders alone fail
 * accessibility), an optional leading lucide icon, and an inline error message.
 */
const Input = forwardRef(function Input(
  { label, icon: Icon, error, required, className, id, hint, rightSlot, ...props },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-small font-medium text-ink">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/50"
          />
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          required={required}
          className={cn(
            'w-full rounded-pill bg-white py-3 text-body text-ink shadow-input',
            'placeholder:text-[#757575] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
            Icon ? 'pl-11 pr-4' : 'px-5',
            rightSlot && 'pr-12',
            error && 'ring-2 ring-red-400'
          )}
          {...props}
        />
        {rightSlot && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>
        )}
      </div>
      {hint && !error && <p className="mt-1 text-small text-ink/50">{hint}</p>}
      {error && (
        <p id={errorId} className="mt-1 text-small text-red-600">
          {error}
        </p>
      )}
    </div>
  );
});

export default Input;
