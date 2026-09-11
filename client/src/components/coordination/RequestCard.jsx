import { useTranslation } from 'react-i18next';
import { Users, CalendarDays, Clock, Send } from 'lucide-react';
import { Card, Button } from '../ui/index.js';
import ServiceIcon from './ServiceIcon.jsx';
import RequestStatusBadge from './RequestStatusBadge.jsx';
import { formatDate } from '../../lib/utils.js';

/**
 * One request, as seen in a list. The same card serves the outgoing and incoming
 * boxes — what differs is the action beneath it, which the parent supplies.
 */
export default function RequestCard({ request, actions, showRequester = false }) {
  const { t, i18n } = useTranslation();
  const counts = request.responseCounts ?? { offer: 0, partial: 0, decline: 0, total: 0 };

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-card bg-primary/10 text-primary">
            <ServiceIcon name={request.serviceTypeId?.icon} size={18} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h4 className="text-body-lg font-semibold text-ink">{request.title}</h4>
            <p className="text-small text-ink/55">
              {request.serviceTypeId?.name}
              {showRequester && request.municipalityId?.name
                ? ` · ${request.municipalityId.name}`
                : ''}
            </p>
          </div>
        </div>
        <RequestStatusBadge status={request.status} />
      </div>

      {request.details && (
        <p className="mt-3 text-body text-ink/75">{request.details}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-small text-ink/60">
        {request.peopleCount && (
          <span className="inline-flex items-center gap-1.5">
            <Users size={14} aria-hidden="true" /> {t('coord.people', { count: request.peopleCount })}
          </span>
        )}
        {request.neededFrom && (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={14} aria-hidden="true" />
            {formatDate(request.neededFrom, i18n.language)}
            {request.neededTo ? ` – ${formatDate(request.neededTo, i18n.language)}` : ''}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <Clock size={14} aria-hidden="true" />
          {t('coord.raisedOn', { date: formatDate(request.createdAt, i18n.language) })}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Send size={14} aria-hidden="true" />
          {t('coord.sentTo', { count: request.recipients?.length ?? 0 })}
        </span>
      </div>

      {counts.total > 0 && (
        <p className="mt-3 text-small text-ink/70">
          {t('coord.responseSummary', {
            offer: counts.offer,
            partial: counts.partial,
            decline: counts.decline,
          })}
        </p>
      )}

      {request.status === 'fulfilled' && request.fulfilledByMunicipalityId?.name && (
        <p className="mt-2 text-small text-primary">
          {t('coord.fulfilledBy', { name: request.fulfilledByMunicipalityId.name })}
        </p>
      )}
      {request.closedNote && (
        <p className="mt-2 rounded-card bg-black/[0.03] p-2 text-small text-ink/70">
          {request.closedNote}
        </p>
      )}

      {actions && <div className="mt-4 flex flex-wrap justify-end gap-2">{actions}</div>}
    </Card>
  );
}

/** Shared empty-action button so both boxes read the same. */
export function RequestAction({ children, ...props }) {
  return <Button size="sm" {...props}>{children}</Button>;
}
