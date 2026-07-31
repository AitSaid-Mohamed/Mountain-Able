import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils.js';

/**
 * Select with an always-visible label, an optional leading lucide icon and a
 * custom chevron. `options` is an array of `{ value, label }`.
 */
const Select = forwardRef(function Select(
  { label, icon: Icon, error, required, options = [], placeholder, className, id, ...props },
  ref
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const errorId = `${selectId}-error`;

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-small font-medium text-ink">
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
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          required={required}
          className={cn(
            'w-full appearance-none rounded-pill bg-white py-3 text-body text-ink shadow-input',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
            Icon ? 'pl-11 pr-10' : 'pl-5 pr-10',
            error && 'ring-2 ring-red-400'
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink/50"
        />
      </div>
      {error && (
        <p id={errorId} className="mt-1 text-small text-red-600">
          {error}
        </p>
      )}
    </div>
  );
});

export default Select;
