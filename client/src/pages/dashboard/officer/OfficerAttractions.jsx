import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { PageHeader, Panel, AttractionManager } from '../../../components/dashboard/index.js';
import { Select, EmptyState } from '../../../components/ui/index.js';
import { useOfficerScope } from '../../../hooks/useOfficerScope.js';
import { useDashboard } from '../../../context/DashboardContext.js';
import { useFetch } from '../../../hooks/useFetch.js';

export default function OfficerAttractions() {
  const { t } = useTranslation();
  const { villages, loading } = useOfficerScope();
  const { readOnly } = useDashboard();
  const { data: categories } = useFetch('/categories');
  const [villageId, setVillageId] = useState('');

  useEffect(() => {
    if (!villageId && villages.length) setVillageId(villages[0]._id);
  }, [villages, villageId]);

  return (
    <div>
      <PageHeader title={t('dash.nav.attractions')} />
      {!loading && villages.length === 0 ? (
        <EmptyState title={t('dash.officer.noVillages')} />
      ) : (
        <Panel
          icon={Sparkles}
          title={t('dash.nav.attractions')}
          action={
            <div className="w-56">
              <Select value={villageId} onChange={(e) => setVillageId(e.target.value)}
                options={villages.map((v) => ({ value: v._id, label: v.name }))} />
            </div>
          }
        >
          <AttractionManager villageId={villageId} categories={categories ?? []} readOnly={readOnly} />
        </Panel>
      )}
    </div>
  );
}
