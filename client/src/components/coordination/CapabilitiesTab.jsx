import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Pencil, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, Button, Input, Badge, Modal, Skeleton, ErrorState } from '../ui/index.js';
import ServiceIcon from './ServiceIcon.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../context/ToastContext.jsx';
import api from '../../lib/api.js';
import { invalidate } from '../../lib/requestCache.js';
import { formatDate } from '../../lib/utils.js';

/**
 * "Our capabilities" — the declaration surface, and deliberately the cheapest
 * action in the whole feature.
 *
 * The directory is worthless until municipalities declare, and nobody declares
 * into an empty directory; the only answer to that is to make declaring take a
 * minute. So it is a list of toggles over the fixed taxonomy rather than a form
 * to fill in from scratch.
 */
export default function CapabilitiesTab({ readOnly }) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const { data: types, loading: typesLoading, error: typesError, refetch: refetchTypes } =
    useFetch('/service-types');
  const { data: mine, loading, error, refetch } = useFetch('/capabilities/mine');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  const declared = new Map((mine ?? []).map((c) => [String(c.serviceTypeId?._id), c]));

  const refresh = () => {
    invalidate('/capabilities');
    refetch();
  };

  const toggle = async (type) => {
    const existing = declared.get(String(type._id));
    setBusy(true);
    try {
      if (existing) {
        await api.patch(`/capabilities/${existing._id}`, { isActive: !existing.isActive });
        toast.success(existing.isActive ? t('coord.cap.paused') : t('coord.cap.resumed'));
      } else {
        await api.post('/capabilities', { serviceTypeId: type._id });
        toast.success(t('coord.cap.declared'));
      }
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('auth.errors.generic'));
    } finally {
      setBusy(false);
    }
  };

  const confirmStill = async (capability) => {
    setBusy(true);
    try {
      await api.post(`/capabilities/${capability._id}/confirm`);
      toast.success(t('coord.cap.confirmed'));
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('auth.errors.generic'));
    } finally {
      setBusy(false);
    }
  };

  const save = async (form) => {
    setBusy(true);
    try {
      await api.patch(`/capabilities/${editing._id}`, form);
      toast.success(t('coord.cap.saved'));
      setEditing(null);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('auth.errors.generic'));
    } finally {
      setBusy(false);
    }
  };

  if (error || typesError) {
    return <ErrorState error={error ?? typesError} onRetry={error ? refetch : refetchTypes} />;
  }
  if (loading || typesLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-card" />)}
      </div>
    );
  }

  const groups = [...new Set((types ?? []).map((s) => s.group))];

  return (
    <div className="space-y-8">
      <p className="max-w-3xl text-body text-ink/70">{t('coord.cap.intro')}</p>

      {groups.map((group) => (
        <section key={group}>
          <h3 className="mb-3 text-h3 text-ink">{t(`coord.group.${group}`)}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {(types ?? []).filter((s) => s.group === group).map((type) => {
              const cap = declared.get(String(type._id));
              const on = Boolean(cap?.isActive);
              return (
                <Card key={type._id} className={`p-4 ${on ? '' : 'opacity-70'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-card ${on ? 'bg-primary/10 text-primary' : 'bg-black/5 text-ink/40'}`}>
                      <ServiceIcon name={type.icon} size={18} aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-body-lg font-semibold text-ink">{type.name}</h4>
                        {on && cap?.isStale && (
                          <Badge tone="amber">
                            <AlertTriangle size={12} aria-hidden="true" /> {t('coord.cap.stale')}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-small text-ink/60">{type.description}</p>

                      {cap?.description && (
                        <p className="mt-2 rounded-card bg-black/[0.03] p-2 text-small text-ink/75">
                          {cap.description}
                        </p>
                      )}
                      {on && cap?.reviewedAt && (
                        <p className="mt-2 text-small text-ink/50">
                          {t('coord.cap.confirmedOn', {
                            date: formatDate(cap.reviewedAt, i18n.language),
                          })}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" variant={on ? 'outline' : 'brand'} disabled={readOnly || busy}
                          onClick={() => toggle(type)}>
                          {on ? t('coord.cap.pause') : t('coord.cap.declare')}
                        </Button>
                        {cap && (
                          <>
                            <Button size="sm" variant="ghost" disabled={readOnly || busy}
                              onClick={() => setEditing(cap)}>
                              <Pencil size={14} /> {t('common.edit')}
                            </Button>
                            {on && cap.isStale && (
                              <Button size="sm" variant="ghost" disabled={readOnly || busy}
                                onClick={() => confirmStill(cap)}>
                                <RefreshCw size={14} /> {t('coord.cap.confirmStill')}
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    {on && <Check size={18} className="shrink-0 text-primary" aria-hidden="true" />}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      ))}

      <EditCapability
        capability={editing}
        busy={busy}
        onClose={() => setEditing(null)}
        onSave={save}
      />
    </div>
  );
}

/** Detail and contact for one declaration — who a neighbour should approach. */
function EditCapability({ capability, busy, onClose, onSave }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(null);

  const current = form ?? {
    description: capability?.description ?? '',
    contactName: capability?.contactName ?? '',
    contactEmail: capability?.contactEmail ?? '',
    contactPhone: capability?.contactPhone ?? '',
  };
  const set = (k) => (e) => setForm({ ...current, [k]: e.target.value });

  const close = () => {
    setForm(null);
    onClose();
  };

  return (
    <Modal open={Boolean(capability)} onClose={close} size="sm" title={t('coord.cap.editTitle')}>
      {capability && (
        <div className="p-6">
          <h3 className="text-h3 text-ink">{capability.serviceTypeId?.name}</h3>
          <p className="mt-1 text-small text-ink/60">{t('coord.cap.editHint')}</p>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="cap-desc" className="mb-1.5 block text-small font-medium text-ink">
                {t('coord.cap.detail')}
              </label>
              <textarea id="cap-desc" rows={3} value={current.description} onChange={set('description')}
                placeholder={t('coord.cap.detailPlaceholder')}
                className="w-full rounded-card bg-white p-3 text-body text-ink shadow-input focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" />
            </div>
            <Input label={t('coord.cap.contactName')} value={current.contactName} onChange={set('contactName')} />
            <Input label={t('coord.cap.contactEmail')} type="email" value={current.contactEmail} onChange={set('contactEmail')} />
            <Input label={t('coord.cap.contactPhone')} value={current.contactPhone} onChange={set('contactPhone')} />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={close}>{t('common.cancel')}</Button>
            <Button variant="brand" loading={busy} onClick={() => onSave(current)}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
