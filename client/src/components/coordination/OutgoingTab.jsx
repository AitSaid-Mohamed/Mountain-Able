import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Inbox, Info } from 'lucide-react';
import {
  Button, Input, Select, Modal, Skeleton, EmptyState, ErrorState, Badge,
} from '../ui/index.js';
import RequestCard from './RequestCard.jsx';
import ServiceIcon from './ServiceIcon.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../context/ToastContext.jsx';
import api from '../../lib/api.js';
import { invalidate, cachedGet } from '../../lib/requestCache.js';
import { formatDate } from '../../lib/utils.js';

const RADII = [25, 50, 60, 100, 200];

/** Requests this municipality raised: track responses, then close the record. */
export default function OutgoingTab({ readOnly }) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [raising, setRaising] = useState(false);
  const [closing, setClosing] = useState(null);
  const [busy, setBusy] = useState(false);

  const { data, loading, error, refetch } = useFetch('/coordination/requests', {
    params: { box: 'outgoing', limit: 50 },
  });

  const refresh = () => {
    invalidate('/coordination');
    refetch();
  };

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const rows = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-body text-ink/70">{t('coord.outgoing.intro')}</p>
        <Button variant="brand" disabled={readOnly} onClick={() => setRaising(true)}>
          <Plus size={16} /> {t('coord.outgoing.raise')}
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4">{[0, 1].map((i) => <Skeleton key={i} className="h-44 rounded-card" />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState icon={Inbox} title={t('coord.outgoing.empty')} description={t('coord.outgoing.emptyHint')} />
      ) : (
        <div className="grid gap-4">
          {rows.map((r) => (
            <RequestCard
              key={r._id}
              request={r}
              actions={
                r.status === 'open' && !readOnly ? (
                  <Button size="sm" variant="outline" onClick={() => setClosing(r)}>
                    {t('coord.outgoing.close')}
                  </Button>
                ) : null
              }
            />
          ))}
        </div>
      )}

      <RaiseDialog
        open={raising}
        onClose={() => setRaising(false)}
        onCreated={() => { setRaising(false); refresh(); }}
      />
      <CloseDialog
        request={closing}
        busy={busy}
        setBusy={setBusy}
        onClose={() => setClosing(null)}
        onClosed={() => { setClosing(null); refresh(); }}
      />
    </div>
  );
}

/**
 * Raising a request, with a preview of exactly who will receive it.
 *
 * The preview is not decoration: an officer must never be unsure which
 * administrations they just contacted. The server resolves the recipient list
 * again on create rather than trusting what the client saw.
 */
function RaiseDialog({ open, onClose, onCreated }) {
  const { t } = useTranslation();
  const toast = useToast();
  const { data: types } = useFetch('/service-types');
  const [form, setForm] = useState({
    serviceTypeId: '', title: '', details: '', neededFrom: '', neededTo: '',
    peopleCount: '', radiusKm: 60,
  });
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const loadPreview = async (serviceTypeId, radiusKm) => {
    if (!serviceTypeId) return setPreview(null);
    setPreviewing(true);
    try {
      const res = await cachedGet('/coordination/candidates', {
        params: { serviceTypeId, radiusKm },
      });
      setPreview(res.data);
    } catch {
      setPreview(null);
    } finally {
      setPreviewing(false);
    }
  };

  const onService = (e) => {
    const serviceTypeId = e.target.value;
    setForm((f) => ({ ...f, serviceTypeId }));
    loadPreview(serviceTypeId, form.radiusKm);
  };
  const onRadius = (e) => {
    const radiusKm = Number(e.target.value);
    setForm((f) => ({ ...f, radiusKm }));
    loadPreview(form.serviceTypeId, radiusKm);
  };

  const submit = async () => {
    const next = {};
    if (!form.serviceTypeId) next.serviceTypeId = t('coord.errors.serviceRequired');
    if (!form.title.trim()) next.title = t('coord.errors.titleRequired');
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await api.post('/coordination/requests', {
        serviceTypeId: form.serviceTypeId,
        title: form.title,
        details: form.details || undefined,
        neededFrom: form.neededFrom || undefined,
        neededTo: form.neededTo || undefined,
        peopleCount: form.peopleCount || undefined,
        radiusKm: form.radiusKm,
      });
      toast.success(t('coord.outgoing.sent'));
      setForm({ serviceTypeId: '', title: '', details: '', neededFrom: '', neededTo: '', peopleCount: '', radiusKm: 60 });
      setPreview(null);
      onCreated();
    } catch (err) {
      if (err.response?.data?.errors) setErrors(err.response.data.errors);
      toast.error(err.response?.data?.message ?? t('auth.errors.generic'));
    } finally {
      setBusy(false);
    }
  };

  const candidates = preview?.candidates ?? [];

  return (
    <Modal open={open} onClose={onClose} size="lg" title={t('coord.outgoing.raise')}>
      <div className="max-h-[80vh] overflow-y-auto p-6">
        <h3 className="text-h3 text-ink">{t('coord.outgoing.raise')}</h3>
        <p className="mt-1 text-small text-ink/60">{t('coord.outgoing.raiseHint')}</p>

        <div className="mt-5 space-y-4">
          <Select label={t('coord.neighbours.service')} required value={form.serviceTypeId}
            onChange={onService} error={errors.serviceTypeId}
            options={[
              { value: '', label: t('coord.outgoing.chooseService') },
              ...(types ?? []).map((s) => ({ value: s._id, label: s.name })),
            ]} />
          <Input label={t('coord.outgoing.title')} required value={form.title}
            onChange={set('title')} error={errors.title}
            placeholder={t('coord.outgoing.titlePlaceholder')} />
          <div>
            <label htmlFor="req-details" className="mb-1.5 block text-small font-medium text-ink">
              {t('coord.outgoing.details')}
            </label>
            <textarea id="req-details" rows={3} value={form.details} onChange={set('details')}
              placeholder={t('coord.outgoing.detailsPlaceholder')}
              className="w-full rounded-card bg-white p-3 text-body text-ink shadow-input focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input type="date" label={t('coord.outgoing.from')} value={form.neededFrom} onChange={set('neededFrom')} />
            <Input type="date" label={t('coord.outgoing.to')} value={form.neededTo} onChange={set('neededTo')} error={errors.neededTo} />
            <Input type="number" min="1" label={t('coord.outgoing.people')} value={form.peopleCount} onChange={set('peopleCount')} />
          </div>
          <div className="w-44">
            <Select label={t('coord.neighbours.radius')} value={String(form.radiusKm)} onChange={onRadius}
              options={RADII.map((r) => ({ value: String(r), label: `${r} km` }))} />
          </div>
        </div>

        {/* Who this will reach — shown before anything is sent. */}
        <div className="mt-6 rounded-card border border-ink/10 p-4">
          <h4 className="text-body-lg font-semibold text-ink">{t('coord.outgoing.willReach')}</h4>
          {!form.serviceTypeId ? (
            <p className="mt-2 text-small text-ink/60">{t('coord.outgoing.chooseServiceFirst')}</p>
          ) : previewing ? (
            <Skeleton className="mt-3 h-16 rounded-card" />
          ) : candidates.length === 0 ? (
            <div className="mt-2">
              <p className="text-small text-[#9a6b00]">
                {t('coord.outgoing.noRecipients', { radius: form.radiusKm })}
              </p>
              {(preview?.nearest ?? []).length > 0 && (
                <p className="mt-2 text-small text-ink/60">
                  {t('coord.outgoing.nearestAre', {
                    list: preview.nearest
                      .map((n) => `${n.municipality?.name} (${n.travelMinutes ?? '—'} min)`)
                      .join(', '),
                  })}
                </p>
              )}
            </div>
          ) : (
            <>
              <ul className="mt-3 space-y-2">
                {candidates.map((c) => (
                  <li key={c.municipalityId} className="flex items-center justify-between gap-3 text-small">
                    <span className="min-w-0 truncate text-ink">{c.municipality?.name}</span>
                    <span className="shrink-0 text-ink/60">
                      {c.travelMinutes != null
                        ? t('coord.byRoadFull', { min: c.travelMinutes, km: c.travelKm })
                        : t('coord.straightKm', { km: c.straightKm })}
                    </span>
                  </li>
                ))}
              </ul>
              {preview?.rankedBy === 'straight-line' && (
                <p className="mt-3 flex items-start gap-2 text-small text-[#9a6b00]">
                  <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                  {t('coord.neighbours.straightLineNote')}
                </p>
              )}
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="brand" loading={busy} disabled={candidates.length === 0} onClick={submit}>
            {t('coord.outgoing.send')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Closing a request. Only the requester decides whether their need was met — a
 * neighbour's offer is not the same as the need being satisfied, which is why
 * responses never move the status by themselves.
 */
function CloseDialog({ request, busy, setBusy, onClose, onClosed }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [status, setStatus] = useState('fulfilled');
  const [by, setBy] = useState('');
  const [note, setNote] = useState('');

  const submit = async () => {
    setBusy(true);
    try {
      await api.patch(`/coordination/requests/${request._id}`, {
        status,
        closedNote: note || undefined,
        fulfilledByMunicipalityId: status === 'fulfilled' && by ? by : undefined,
      });
      toast.success(t('coord.outgoing.closed'));
      setStatus('fulfilled'); setBy(''); setNote('');
      onClosed();
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('auth.errors.generic'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={Boolean(request)} onClose={onClose} size="sm" title={t('coord.outgoing.close')}>
      {request && (
        <div className="p-6">
          <h3 className="text-h3 text-ink">{t('coord.outgoing.close')}</h3>
          <p className="mt-1 text-small text-ink/60">{t('coord.outgoing.closeHint')}</p>

          <div className="mt-4 space-y-4">
            <Select label={t('coord.outgoing.outcome')} value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: 'fulfilled', label: t('coord.status.fulfilled') },
                { value: 'unmet', label: t('coord.status.unmet') },
                { value: 'cancelled', label: t('coord.status.cancelled') },
              ]} />
            {status === 'fulfilled' && (
              <Select label={t('coord.outgoing.whoHelped')} value={by}
                onChange={(e) => setBy(e.target.value)}
                options={[
                  { value: '', label: t('coord.outgoing.noOneNamed') },
                  ...(request.recipients ?? []).map((r) => ({
                    value: r.municipalityId?._id ?? r.municipalityId,
                    label: r.municipalityId?.name ?? '—',
                  })),
                ]} />
            )}
            <div>
              <label htmlFor="close-note" className="mb-1.5 block text-small font-medium text-ink">
                {t('coord.outgoing.note')}
              </label>
              <textarea id="close-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)}
                placeholder={t('coord.outgoing.notePlaceholder')}
                className="w-full rounded-card bg-white p-3 text-body text-ink shadow-input focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" />
              <p className="mt-1.5 text-small text-ink/55">{t('coord.outgoing.noteWhy')}</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
            <Button variant="brand" loading={busy} onClick={submit}>{t('coord.outgoing.recordOutcome')}</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
