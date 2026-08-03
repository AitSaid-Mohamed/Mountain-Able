import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Trash2, Star, ImagePlus, Info } from 'lucide-react';
import { PageHeader, Panel, AttractionManager, EventManager, MarkerPicker } from '../../../components/dashboard/index.js';
import { Input, Select, Button, Badge, Spinner } from '../../../components/ui/index.js';
import { useDashboard } from '../../../context/DashboardContext.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { useFetch } from '../../../hooks/useFetch.js';
import api from '../../../lib/api.js';
import { cachedGet } from '../../../lib/requestCache.js';
import { mediaUrl, onImageError } from '../../../lib/utils.js';

const EMPTY = { name: '', description: '', shortDescription: '', region: '', province: '', altitude: '', population: '', location: { lat: '', lng: '' } };

export default function VillageEditor() {
  const { id } = useParams();
  const isNew = !id;
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const { readOnly, config } = useDashboard();
  const base = config.base;
  const [sp, setSp] = useSearchParams();
  const [tab, setTab] = useState(sp.get('tab') || 'details');
  const { data: categories } = useFetch('/categories');

  const [form, setForm] = useState(EMPTY);
  const [village, setVillage] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const dirty = useRef(false);

  // Load existing village by id (via slug-less detail: fetch list? use direct).
  useEffect(() => {
    if (isNew) return;
    let active = true;
    (async () => {
      try {
        // The detail endpoint is by slug; look the village up in the officer's
        // list by id. Through the shared cache, so this reuses the identical
        // request the officer scope has already made rather than repeating it.
        const res = await cachedGet('/villages', { params: { includeUnpublished: 'true', limit: 50 } });
        const v = res.data.find((x) => x._id === id);
        if (!v) throw new Error('not found');
        if (!active) return;
        setVillage(v);
        setForm({
          name: v.name, description: v.description, shortDescription: v.shortDescription ?? '',
          region: v.region, province: v.province,
          altitude: v.altitude ?? '', population: v.population ?? '',
          location: { lat: v.location?.lat ?? '', lng: v.location?.lng ?? '' },
        });
      } catch {
        toast.error(t('village.notFound'));
        navigate(`${base}/villages`);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id, isNew]); // eslint-disable-line react-hooks/exhaustive-deps

  // Warn on browser unload with unsaved changes.
  useEffect(() => {
    const h = (e) => { if (dirty.current) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, []);

  const set = (k) => (e) => { dirty.current = true; setForm((f) => ({ ...f, [k]: e.target.value })); };
  const setLoc = (lat, lng) => { dirty.current = true; setForm((f) => ({ ...f, location: { lat, lng } })); };
  const changeTab = (tk) => { setTab(tk); setSp(tk === 'details' ? {} : { tab: tk }, { replace: true }); };

  const saveDetails = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name, description: form.description, shortDescription: form.shortDescription,
        region: form.region, province: form.province,
        altitude: form.altitude === '' ? undefined : Number(form.altitude),
        population: form.population === '' ? undefined : Number(form.population),
        location: { lat: Number(form.location.lat), lng: Number(form.location.lng) },
      };
      if (isNew) {
        const res = await api.post('/villages', payload);
        dirty.current = false;
        toast.success(t('profile.saved'));
        navigate(`${base}/villages/${res.data.data._id}/edit`, { replace: true });
      } else {
        const res = await api.patch(`/villages/${id}`, payload);
        setVillage(res.data.data);
        dirty.current = false;
        toast.success(t('profile.saved'));
      }
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('auth.errors.generic'));
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: 'details', label: t('dash.officer.detailsTab') },
    { key: 'location', label: t('dash.officer.locationTab') },
    { key: 'media', label: t('dash.officer.mediaTab'), disabled: isNew },
    { key: 'attractions', label: t('dash.officer.attractionsTab'), disabled: isNew },
    { key: 'events', label: t('dash.officer.eventsTab'), disabled: isNew },
  ];

  if (loading) return <div className="flex justify-center py-20 text-primary"><Spinner size={28} /></div>;

  return (
    <div>
      <button type="button" onClick={() => navigate(`${base}/villages`)} className="mb-4 inline-flex items-center gap-2 text-body text-ink/60 hover:text-primary">
        <ArrowLeft size={18} /> {t('dash.nav.myVillages')}
      </button>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-[35px] font-medium text-ink">{isNew ? t('dash.officer.newVillage') : t('dash.officer.editVillage')}</h1>
        {village && (
          <Badge tone={village.isPublished ? 'primary' : 'neutral'}>
            {village.isPublished ? t('dash.common.published') : t('dash.common.draft')}
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tb) => (
          <button key={tb.key} type="button" disabled={tb.disabled} onClick={() => changeTab(tb.key)}
            className={`rounded-pill px-4 py-1.5 text-[15px] font-medium transition disabled:opacity-40 ${tab === tb.key ? 'bg-cta text-[#f3f4f4]' : 'bg-[#f2efef] text-ink hover:bg-[#e8e4e4]'}`}>
            {tb.label}
          </button>
        ))}
      </div>

      {tab === 'details' && (
        <Panel icon={Info} title={t('dash.officer.detailsTab')}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label={t('dash.common.name')} value={form.name} onChange={set('name')} required disabled={readOnly} />
            <Input label={t('dash.officer.shortDescription')} value={form.shortDescription} onChange={set('shortDescription')} disabled={readOnly} />
            <Input label={t('dash.common.region')} value={form.region} onChange={set('region')} required disabled={readOnly} />
            <Input label={t('dash.common.province')} value={form.province} onChange={set('province')} required disabled={readOnly} />
            <Input type="number" label={t('dash.common.altitude')} value={form.altitude} onChange={set('altitude')} disabled={readOnly} />
            <Input type="number" label={t('dash.common.population')} value={form.population} onChange={set('population')} disabled={readOnly} />
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-small font-medium text-ink">{t('dash.officer.description')}</label>
              <textarea rows={5} value={form.description} onChange={set('description')} disabled={readOnly}
                className="w-full rounded-card bg-white px-4 py-3 text-body shadow-input focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60" />
            </div>
          </div>
          <p className="mt-4 flex items-center gap-2 text-small text-ink/50"><Info size={15} /> {t('dash.officer.publishNote')}</p>
          <div className="mt-4 flex justify-end">
            <Button variant="brand" loading={saving} disabled={readOnly} onClick={saveDetails}>{t('common.save')}</Button>
          </div>
        </Panel>
      )}

      {tab === 'location' && (
        <Panel icon={Info} title={t('dash.officer.locationTab')}>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-4">
              <Input type="number" label="Latitude" value={form.location.lat} onChange={(e) => setLoc(Number(e.target.value), form.location.lng)} disabled={readOnly} />
              <Input type="number" label="Longitude" value={form.location.lng} onChange={(e) => setLoc(form.location.lat, Number(e.target.value))} disabled={readOnly} />
              <p className="text-small text-ink/50">{t('dash.officer.dragMarker')}</p>
              <Button variant="brand" loading={saving} disabled={readOnly} onClick={saveDetails}>{t('common.save')}</Button>
            </div>
            <div className="h-72 overflow-hidden rounded-card shadow-card">
              <MarkerPicker lat={Number(form.location.lat)} lng={Number(form.location.lng)} onChange={setLoc} className="h-full" />
            </div>
          </div>
        </Panel>
      )}

      {tab === 'media' && village && <MediaTab village={village} readOnly={readOnly} onChange={setVillage} />}
      {tab === 'attractions' && <Panel icon={Info} title={t('dash.officer.attractionsTab')}><AttractionManager villageId={id} categories={categories ?? []} readOnly={readOnly} /></Panel>}
      {tab === 'events' && <Panel icon={Info} title={t('dash.officer.eventsTab')}><EventManager villageId={id} readOnly={readOnly} /></Panel>}
    </div>
  );
}

function MediaTab({ village, readOnly, onChange }) {
  const { t } = useTranslation();
  const toast = useToast();
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const images = village.images ?? [];

  const upload = async (files) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const fd = new FormData();
      [...files].forEach((f) => fd.append('images', f));
      const res = await api.post(`/villages/${village._id}/images`, fd, { headers: { 'Content-Type': undefined } });
      onChange(res.data.data);
      toast.success(t('profile.saved'));
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('auth.errors.generic'));
    } finally {
      setBusy(false);
    }
  };

  const removeAt = async (idx) => {
    setBusy(true);
    try {
      const res = await api.delete(`/villages/${village._id}/images/${idx}`);
      onChange(res.data.data);
    } catch { toast.error(t('auth.errors.generic')); } finally { setBusy(false); }
  };

  const setCover = async (url) => {
    setBusy(true);
    try {
      const res = await api.patch(`/villages/${village._id}`, { coverImage: url });
      onChange(res.data.data);
      toast.success(t('dash.officer.setCover'));
    } catch { toast.error(t('auth.errors.generic')); } finally { setBusy(false); }
  };

  return (
    <Panel icon={ImagePlus} title={t('dash.officer.mediaTab')}>
      <button
        type="button"
        disabled={readOnly || busy}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); if (!readOnly) upload(e.dataTransfer.files); }}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-ink/20 py-10 text-ink/50 transition hover:border-primary/50 disabled:opacity-50"
      >
        {busy ? <Spinner size={22} /> : <ImagePlus size={26} />}
        {t('dash.officer.uploadImages')}
      </button>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => upload(e.target.files)} />

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((src, idx) => (
          <div key={idx} className="group relative overflow-hidden rounded-card">
            <img src={mediaUrl(src)} alt="" onError={onImageError} className="h-28 w-full object-cover" />
            {village.coverImage === src && (
              <span className="absolute left-1 top-1 rounded-pill bg-cta px-2 py-0.5 text-[11px] font-semibold text-white">{t('dash.officer.cover')}</span>
            )}
            {!readOnly && (
              <div className="absolute inset-0 hidden items-center justify-center gap-2 bg-black/40 group-hover:flex">
                <button type="button" onClick={() => setCover(src)} title={t('dash.officer.setCover')} className="rounded-full bg-white/90 p-1.5 text-cta"><Star size={16} /></button>
                <button type="button" onClick={() => removeAt(idx)} title={t('common.delete')} className="rounded-full bg-white/90 p-1.5 text-red-500"><Trash2 size={16} /></button>
              </div>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}
