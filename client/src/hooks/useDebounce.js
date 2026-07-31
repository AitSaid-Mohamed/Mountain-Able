import { useState, useEffect } from 'react';

/**
 * Return a debounced copy of `value` that only updates after `delay` ms of
 * no changes. Used to throttle the villages search input (400ms).
 */
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
