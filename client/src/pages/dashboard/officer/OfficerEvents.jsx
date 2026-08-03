import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays } from 'lucide-react';
import { PageHeader, Panel, EventManager } from '../../../components/dashboard/index.js';
import { Select, EmptyState } from '../../../components/ui/index.js';
import { useOfficerScope } from '../../../context/OfficerScopeContext.jsx';
import { useDashboard } from '../../../context/DashboardContext.js';

export default function OfficerEvents() {
  const { t } = useTranslation();
  const { villages, loading } = useOfficerScope();
  const { readOnly } = useDashboard();
  const [villageId, setVillageId] = useState('');

  useEffect(() => {
    if (!villageId && villages.length) setVillageId(villages[0]._id);
  }, [villages, villageId]);

  return (
    <div>
      <PageHeader title={t('dash.nav.events')} />
      {!loading && villages.length === 0 ? (
        <EmptyState title={t('dash.officer.noVillages')} />
      ) : (
        <Panel
          icon={CalendarDays}
          title={t('dash.nav.events')}
          action={
            <div className="w-56">
              <Select value={villageId} onChange={(e) => setVillageId(e.target.value)}
                options={villages.map((v) => ({ value: v._id, label: v.name }))} />
            </div>
          }
        >
          <EventManager villageId={villageId} readOnly={readOnly} />
        </Panel>
      )}
    </div>
  );
}
