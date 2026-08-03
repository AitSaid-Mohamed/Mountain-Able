import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Sparkles, CalendarDays, ExternalLink, Trash2 } from 'lucide-react';
import { PageHeader, RowActions } from '../../../components/dashboard/index.js';
import { DataTable, Input, Select, Button, Rating, Badge, ConfirmDialog } from '../../../components/ui/index.js';
import { useOfficerScope } from '../../../context/OfficerScopeContext.jsx';
import { useDashboard } from '../../../context/DashboardContext.js';
import { useToast } from '../../../context/ToastContext.jsx';
import api from '../../../lib/api.js';
import { formatDate } from '../../../lib/utils.js';

export default function OfficerVillages() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const { readOnly } = useDashboard();
  const { villages, loading, error, refetch } = useOfficerScope();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    return villages.filter((v) => {
      if (search && !v.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (status === 'published' && !v.isPublished) return false;
      if (status === 'draft' && v.isPublished) return false;
      return true;
    });
  }, [villages, search, status]);

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/villages/${toDelete._id}`);
      toast.success(t('common.delete'));
      setToDelete(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message ?? t('auth.errors.generic'));
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: 'name', header: t('dash.common.name'), sortable: true,
      render: (v) => (
        <div className="flex items-center gap-3">
          <img src={v.coverImage} alt="" className="h-9 w-12 shrink-0 rounded object-cover" onError={(e) => (e.currentTarget.style.visibility = 'hidden')} />
          <Link to={`/dashboard/villages/${v._id}/edit`} className="font-medium text-primary hover:underline">{v.name}</Link>
        </div>
      ),
    },
    { key: 'region', header: t('dash.common.region'), sortable: true },
    { key: 'attractionsCount', header: t('dash.common.attractions'), sortable: true, className: 'text-center' },
    { key: 'ratingAverage', header: t('dash.common.rating'), sortable: true, render: (v) => <Rating value={v.ratingAverage} count={v.ratingCount} size={14} /> },
    {
      key: 'isPublished', header: t('dash.common.status'),
      render: (v) => <Badge tone={v.isPublished ? 'primary' : 'neutral'}>{v.isPublished ? t('dash.common.published') : t('dash.common.draft')}</Badge>,
    },
    { key: 'updatedAt', header: t('dash.common.updated'), sortable: true, cardHidden: true, render: (v) => <span className="text-small text-ink/60">{formatDate(v.updatedAt, i18n.language)}</span> },
    {
      key: 'actions', header: '', className: 'text-right',
      render: (v) => (
        <RowActions
          items={[
            { label: t('common.edit'), icon: Pencil, onClick: () => navigate(`/dashboard/villages/${v._id}/edit`) },
            { label: t('dash.officer.manageAttractions'), icon: Sparkles, onClick: () => navigate(`/dashboard/villages/${v._id}/edit?tab=attractions`) },
            { label: t('dash.officer.manageEvents'), icon: CalendarDays, onClick: () => navigate(`/dashboard/villages/${v._id}/edit?tab=events`) },
            { label: t('dash.officer.preview'), icon: ExternalLink, onClick: () => window.open(`/villages/${v.slug}`, '_blank') },
            { label: t('common.delete'), icon: Trash2, danger: true, disabled: readOnly, onClick: () => setToDelete(v) },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('dash.nav.myVillages')}
        actions={
          <Button variant="brand" disabled={readOnly} onClick={() => navigate('/dashboard/villages/new')}>
            <Plus size={18} /> {t('dash.officer.addVillage')}
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="w-full sm:w-64">
          <Input placeholder={t('dash.common.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: '', label: t('dash.common.all') },
              { value: 'published', label: t('dash.common.published') },
              { value: 'draft', label: t('dash.common.draft') },
            ]}
          />
        </div>
      </div>

      <DataTable columns={columns} rows={rows} loading={loading} error={error} onRetry={refetch}
        emptyTitle={t('dash.officer.noVillages')} />

      <ConfirmDialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} onConfirm={remove} loading={busy}
        message={toDelete ? `${t('common.delete')} “${toDelete.name}”?` : ''} />
    </div>
  );
}
