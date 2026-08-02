import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { PageHeader, RowActions } from '../../../components/dashboard/index.js';
import { DataTable, Input, Button, Rating, Badge, ConfirmDialog } from '../../../components/ui/index.js';
import { useFetch } from '../../../hooks/useFetch.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { useDebounce } from '../../../hooks/useDebounce.js';
import api from '../../../lib/api.js';

const SORT_TO_KEY = { name: { key: 'name', dir: 'asc' }, '-name': { key: 'name', dir: 'desc' }, rating: { key: 'ratingAverage', dir: 'asc' }, '-rating': { key: 'ratingAverage', dir: 'desc' }, newest: { key: 'createdAt', dir: 'desc' } };
const keyToSort = ({ key, dir }) => (key === 'name' ? (dir === 'asc' ? 'name' : '-name') : key === 'ratingAverage' ? (dir === 'asc' ? 'rating' : '-rating') : 'newest');

export default function AdminVillages() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(params.get('search') ?? '');
  const search = useDebounce(searchInput, 400);
  const page = Math.max(1, parseInt(params.get('page') ?? '1', 10) || 1);
  const sort = params.get('sort') ?? 'newest';
  const [selected, setSelected] = useState([]);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const { data, meta, loading, error, refetch } = useFetch('/villages', {
    params: { includeUnpublished: 'true', page, limit: 10, sort, ...(search && { search }) },
    deps: [search],
  });
  const rows = data ?? [];

  const setParam = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v == null || v === '' ? next.delete(k) : next.set(k, v)));
    setParams(next, { replace: true });
  };

  const togglePublish = async (v) => {
    try {
      await api.patch(`/villages/${v._id}/publish`, { isPublished: !v.isPublished });
      toast.success(v.isPublished ? t('dash.admin.unpublish') : t('dash.admin.publish'));
      refetch();
    } catch { toast.error(t('auth.errors.generic')); }
  };

  const bulkPublish = async (publish) => {
    setBusy(true);
    try {
      await Promise.all(selected.map((id) => api.patch(`/villages/${id}/publish`, { isPublished: publish })));
      toast.success(publish ? t('dash.admin.publish') : t('dash.admin.unpublish'));
      setSelected([]);
      refetch();
    } catch { toast.error(t('auth.errors.generic')); } finally { setBusy(false); }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/villages/${toDelete._id}`);
      toast.success(t('common.delete'));
      setToDelete(null);
      refetch();
    } catch { toast.error(t('auth.errors.generic')); } finally { setBusy(false); }
  };

  const toggleSel = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const toggleAll = (pageRows) => {
    const ids = pageRows.map((r) => r._id);
    const allIn = ids.every((id) => selected.includes(id));
    setSelected((s) => (allIn ? s.filter((id) => !ids.includes(id)) : [...new Set([...s, ...ids])]));
  };

  const columns = [
    {
      key: 'name', header: t('dash.common.name'), sortable: true,
      render: (v) => (
        <div className="flex items-center gap-3">
          <img src={v.coverImage} alt="" onError={(e) => (e.currentTarget.style.visibility = 'hidden')} className="h-9 w-12 shrink-0 rounded object-cover" />
          <button onClick={() => navigate(`/admin/villages/${v._id}/edit`)} className="text-left font-medium text-primary hover:underline">{v.name}</button>
        </div>
      ),
    },
    { key: 'municipality', header: t('dash.common.municipality'), render: (v) => <span className="text-small">{v.municipalityId?.name ?? '—'}</span> },
    { key: 'region', header: t('dash.common.region') },
    { key: 'ratingAverage', header: t('dash.common.rating'), sortable: true, render: (v) => <Rating value={v.ratingAverage} count={v.ratingCount} size={14} /> },
    {
      key: 'isPublished', header: t('dash.common.status'),
      render: (v) => (
        <button onClick={() => togglePublish(v)} className="inline-flex items-center gap-1.5" title={v.isPublished ? t('dash.admin.unpublish') : t('dash.admin.publish')}>
          <Badge tone={v.isPublished ? 'primary' : 'neutral'}>{v.isPublished ? t('dash.common.published') : t('dash.common.draft')}</Badge>
          {v.isPublished ? <Eye size={15} className="text-primary" /> : <EyeOff size={15} className="text-ink/40" />}
        </button>
      ),
    },
    {
      key: 'actions', header: '', className: 'text-right',
      render: (v) => (
        <RowActions items={[
          { label: t('common.edit'), icon: Pencil, onClick: () => navigate(`/admin/villages/${v._id}/edit`) },
          { label: t('dash.officer.preview'), icon: ExternalLink, onClick: () => window.open(`/villages/${v.slug}`, '_blank') },
          { label: t('common.delete'), icon: Trash2, danger: true, onClick: () => setToDelete(v) },
        ]} />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('dash.nav.villages')}
        actions={<Button variant="brand" onClick={() => navigate('/admin/villages/new')}><Plus size={18} /> {t('dash.officer.addVillage')}</Button>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-72">
          <Input placeholder={t('dash.common.searchPlaceholder')} value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setParam({ page: null }); }} />
        </div>
        {selected.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-small text-ink/60">{t('dash.admin.selected', { count: selected.length })}</span>
            <Button size="sm" variant="outline" loading={busy} onClick={() => bulkPublish(true)}>{t('dash.admin.publish')}</Button>
            <Button size="sm" variant="ghost" loading={busy} onClick={() => bulkPublish(false)}>{t('dash.admin.unpublish')}</Button>
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        onRetry={refetch}
        page={page}
        totalPages={meta?.totalPages ?? 1}
        onPageChange={(p) => setParam({ page: p === 1 ? null : String(p) })}
        sort={SORT_TO_KEY[sort]}
        onSortChange={(s) => setParam({ sort: keyToSort(s), page: null })}
        selectable
        selectedIds={selected}
        onToggleSelect={toggleSel}
        onToggleAll={toggleAll}
      />

      <ConfirmDialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} onConfirm={remove} loading={busy}
        message={toDelete ? `${t('common.delete')} “${toDelete.name}”?` : ''} />
    </div>
  );
}
