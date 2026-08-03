import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Flag } from 'lucide-react';
import { PageHeader, Panel } from '../../../components/dashboard/index.js';
import { Select, Rating, Button, Spinner, EmptyState, ErrorState } from '../../../components/ui/index.js';
import { useOfficerScope } from '../../../context/OfficerScopeContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import { formatDate } from '../../../lib/utils.js';

export default function OfficerFeedback() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const { villages, feedback, loading, error: vError, refetch } = useOfficerScope();
  const [villageId, setVillageId] = useState('');
  const [rating, setRating] = useState('');
  const [reported, setReported] = useState([]);

  // The reviews come from the shared officer scope, which already fetches them
  // once per village. This screen previously repeated that fan-out with its own
  // request per village, keyed on the `villages` array identity — so it re-ran
  // every time the scope reloaded.
  const all = feedback;

  const filtered = useMemo(
    () => all.filter((c) => (!villageId || c.villageId === villageId) && (!rating || c.rating === Number(rating))),
    [all, villageId, rating]
  );

  const distribution = useMemo(() => {
    const b = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    all.filter((c) => !villageId || c.villageId === villageId).forEach((c) => (b[c.rating] += 1));
    return b;
  }, [all, villageId]);
  const distTotal = Object.values(distribution).reduce((a, b) => a + b, 0);

  const report = (c) => {
    // No server-side reporting endpoint; acknowledge client-side (see report notes).
    setReported((r) => [...r, c._id]);
    toast.info(t('dash.officer.reported'));
  };

  if (vError) return <ErrorState error={vError} onRetry={refetch} />;

  return (
    <div>
      <PageHeader title={t('dash.nav.feedback')} />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="w-full sm:w-56">
          <Select value={villageId} onChange={(e) => setVillageId(e.target.value)}
            options={[{ value: '', label: t('dash.officer.filterByVillage') }, ...villages.map((v) => ({ value: v._id, label: v.name }))]} />
        </div>
        <div className="w-full sm:w-40">
          <Select value={rating} onChange={(e) => setRating(e.target.value)}
            options={[{ value: '', label: t('dash.common.rating') }, ...[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} ★` }))]} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Panel icon={MessageSquare} title={t('village.distribution')} className="h-fit">
          {[5, 4, 3, 2, 1].map((star) => {
            const c = distribution[star];
            const pct = distTotal ? (c / distTotal) * 100 : 0;
            return (
              <div key={star} className="mb-2 flex items-center gap-2 text-small">
                <span className="w-3 text-ink/60">{star}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/10">
                  <div className="h-full rounded-full bg-[#f5b638]" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-5 text-right text-ink/50">{c}</span>
              </div>
            );
          })}
        </Panel>

        <div>
          {loading ? (
            <div className="flex justify-center py-10 text-ink/40"><Spinner size={24} /></div>
          ) : filtered.length === 0 ? (
            <EmptyState title={t('dash.officer.noFeedback')} />
          ) : (
            <ul className="space-y-3">
              {filtered.map((c) => (
                <li key={c._id} className="rounded-card bg-white p-4 shadow-card">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-ink">{c.userId?.firstName} {c.userId?.lastName}</span>
                    <span className="text-small text-ink/45">{c.villageName} · {formatDate(c.createdAt, i18n.language)}</span>
                  </div>
                  <div className="mt-1"><Rating value={c.rating} size={14} /></div>
                  <p className="mt-2 text-body text-ink/80">{c.content}</p>
                  <div className="mt-2 flex justify-end">
                    <Button size="sm" variant="ghost" disabled={reported.includes(c._id)} onClick={() => report(c)}>
                      <Flag size={14} /> {reported.includes(c._id) ? t('dash.officer.reported') : t('dash.officer.reportToAdmin')}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
