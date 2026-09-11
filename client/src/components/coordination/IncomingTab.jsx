import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Inbox, Check, CircleSlash, SplitSquareHorizontal } from 'lucide-react';
import { Button, Input, Modal, Select, Skeleton, EmptyState, ErrorState } from '../ui/index.js';
import RequestCard from './RequestCard.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../lib/api.js';
import { invalidate } from '../../lib/requestCache.js';

/**
 * Requests routed *to* this municipality.
 *
 * Answering is three options, not two: `partial` is a first-class outcome
 * because a neighbour who can send one minibus instead of two is the realistic
 * case in mountain terrain, and collapsing it into yes/no would misrepresent how
 * coordination actually resolves.
 */
export default function IncomingTab({ readOnly }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [responding, setResponding] = useState(null);

  const { data, loading, error, refetch } = useFetch('/coordination/requests', {
    params: { box: 'incoming', limit: 50 },
  });

  const mine = String(user?.municipalityId?._id ?? user?.municipalityId ?? '');

  const refresh = () => {
    invalidate('/coordination');
    refetch();
  };

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const rows = data ?? [];

  return (
    <div className="space-y-6">
      <p className="max-w-3xl text-body text-ink/70">{t('coord.incoming.intro')}</p>

      {loading ? (
        <div className="grid gap-4">{[0, 1].map((i) => <Skeleton key={i} className="h-44 rounded-card" />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState icon={Inbox} title={t('coord.incoming.empty')} description={t('coord.incoming.emptyHint')} />
      ) : (
        <div className="grid gap-4">
          {rows.map((r) => (
            <RequestCard
              key={r._id}
              request={r}
              showRequester
              actions={
                r.status === 'open' && !readOnly ? (
                  <Button size="sm" variant="brand" onClick={() => setResponding(r)}>
                    {t('coord.incoming.respond')}
                  </Button>
                ) : null
              }
            />
          ))}
        </div>
      )}

      <RespondDialog
        request={responding}
        municipalityId={mine}
        onClose={() => setResponding(null)}
        onDone={() => { setResponding(null); refresh(); }}
      />
    </div>
  );
}

function RespondDialog({ request, municipalityId, onClose, onDone }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [type, setType] = useState('offer');
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState({ contactName: '', contactEmail: '', contactPhone: '' });
  const [busy, setBusy] = useState(false);

  // Prefill the contact from this municipality's own declaration of the service,
  // since that is who a neighbour should already be approaching.
  const { data: capabilities } = useFetch(
    request && municipalityId ? '/capabilities' : null,
    { params: { municipalityId, serviceTypeId: request?.serviceTypeId?._id } }
  );
  const declared = capabilities?.[0];

  const current = {
    contactName: contact.contactName || declared?.contactName || '',
    contactEmail: contact.contactEmail || declared?.contactEmail || '',
    contactPhone: contact.contactPhone || declared?.contactPhone || '',
  };
  const set = (k) => (e) => setContact({ ...current, [k]: e.target.value });

  const submit = async () => {
    setBusy(true);
    try {
      await api.post(`/coordination/requests/${request._id}/responses`, {
        type,
        message: message || undefined,
        ...current,
      });
      toast.success(t('coord.incoming.sent'));
      setType('offer'); setMessage(''); setContact({ contactName: '', contactEmail: '', contactPhone: '' });
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('auth.errors.generic'));
    } finally {
      setBusy(false);
    }
  };

  const OPTIONS = [
    { value: 'offer', label: t('coord.response.offer'), icon: Check, hint: t('coord.response.offerHint') },
    { value: 'partial', label: t('coord.response.partial'), icon: SplitSquareHorizontal, hint: t('coord.response.partialHint') },
    { value: 'decline', label: t('coord.response.decline'), icon: CircleSlash, hint: t('coord.response.declineHint') },
  ];

  return (
    <Modal open={Boolean(request)} onClose={onClose} size="lg" title={t('coord.incoming.respond')}>
      {request && (
        <div className="max-h-[80vh] overflow-y-auto p-6">
          <h3 className="text-h3 text-ink">{request.title}</h3>
          <p className="mt-1 text-small text-ink/60">
            {request.municipalityId?.name} · {request.serviceTypeId?.name}
          </p>

          <div className="mt-5 space-y-3">
            {OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setType(o.value)}
                className={`flex w-full items-start gap-3 rounded-card border p-3 text-left transition ${
                  type === o.value ? 'border-primary bg-primary/5' : 'border-ink/10 hover:bg-black/[0.02]'
                }`}
              >
                <o.icon size={18} className={`mt-0.5 shrink-0 ${type === o.value ? 'text-primary' : 'text-ink/40'}`} aria-hidden="true" />
                <span>
                  <span className="block text-body font-medium text-ink">{o.label}</span>
                  <span className="block text-small text-ink/60">{o.hint}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="mt-5">
            <label htmlFor="resp-msg" className="mb-1.5 block text-small font-medium text-ink">
              {t('coord.incoming.message')}
            </label>
            <textarea id="resp-msg" rows={3} value={message} onChange={(e) => setMessage(e.target.value)}
              placeholder={t('coord.incoming.messagePlaceholder')}
              className="w-full rounded-card bg-white p-3 text-body text-ink shadow-input focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" />
          </div>

          {type !== 'decline' && (
            <div className="mt-5 space-y-4 rounded-card border border-ink/10 p-4">
              <div>
                <h4 className="text-body-lg font-semibold text-ink">{t('coord.incoming.contactTitle')}</h4>
                {/* The platform introduces the two administrations and stops there;
                    these details are the whole mechanism for what follows. */}
                <p className="mt-1 text-small text-ink/60">{t('coord.incoming.contactHint')}</p>
              </div>
              <Input label={t('coord.cap.contactName')} value={current.contactName} onChange={set('contactName')} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label={t('coord.cap.contactEmail')} type="email" value={current.contactEmail} onChange={set('contactEmail')} />
                <Input label={t('coord.cap.contactPhone')} value={current.contactPhone} onChange={set('contactPhone')} />
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
            <Button variant="brand" loading={busy} onClick={submit}>{t('coord.incoming.send')}</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
