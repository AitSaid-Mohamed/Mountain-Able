import * as Icons from 'lucide-react';

/**
 * Render a service type's lucide icon by name, with a safe fallback — the same
 * approach the attraction categories already use, so a taxonomy entry with a
 * mistyped icon degrades to a neutral glyph rather than crashing the screen.
 */
export default function ServiceIcon({ name, ...props }) {
  const Cmp = Icons[name] ?? Icons.Sparkles;
  return <Cmp {...props} />;
}
