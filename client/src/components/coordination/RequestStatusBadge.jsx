import { useTranslation } from 'react-i18next';
import { Badge } from '../ui/index.js';

/**
 * Status pill for a coordination request.
 *
 * `unmet` and `expired` are shown distinctly on purpose: "we were told no" and
 * "nobody replied at all" mean different things to the municipality reading the
 * screen, and the regional authority counts them separately for the same reason.
 */
const TONE = {
  open: 'primary',
  fulfilled: 'primary',
  unmet: 'amber',
  expired: 'amber',
  cancelled: 'neutral',
};

export default function RequestStatusBadge({ status }) {
  const { t } = useTranslation();
  return <Badge tone={TONE[status] ?? 'neutral'}>{t(`coord.status.${status}`)}</Badge>;
}
