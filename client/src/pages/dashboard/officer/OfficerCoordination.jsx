import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Handshake, Users, Send, Inbox } from 'lucide-react';
import { PageHeader } from '../../../components/dashboard/index.js';
import CapabilitiesTab from '../../../components/coordination/CapabilitiesTab.jsx';
import NeighboursTab from '../../../components/coordination/NeighboursTab.jsx';
import OutgoingTab from '../../../components/coordination/OutgoingTab.jsx';
import IncomingTab from '../../../components/coordination/IncomingTab.jsx';
import { useDashboard } from '../../../context/DashboardContext.js';
import { cn } from '../../../lib/utils.js';

/**
 * The officer's coordination area.
 *
 * One nav entry with four tabs rather than four entries: this is a single new
 * area of responsibility — declare what we offer, see what neighbours offer, ask,
 * answer — and splitting it across the sidebar would bury the relationship
 * between the four.
 *
 * The active tab lives in the URL like every other filter in the project, so a
 * tab is linkable and the back button behaves.
 */
const TABS = [
  { key: 'capabilities', icon: Handshake },
  { key: 'neighbours', icon: Users },
  { key: 'outgoing', icon: Send },
  { key: 'incoming', icon: Inbox },
];

export default function OfficerCoordination() {
  const { t } = useTranslation();
  const { readOnly } = useDashboard();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((x) => x.key === params.get('tab')) ? params.get('tab') : 'capabilities';

  const setTab = (key) => {
    const next = new URLSearchParams(params);
    if (key === 'capabilities') next.delete('tab');
    else next.set('tab', key);
    setParams(next, { replace: true });
  };

  return (
    <div>
      <PageHeader title={t('dash.nav.coordination')} />
      <p className="-mt-2 mb-6 max-w-3xl text-body text-ink/70">{t('coord.pageIntro')}</p>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-ink/10">
        {TABS.map(({ key, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-current={tab === key ? 'page' : undefined}
            className={cn(
              '-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-body font-medium transition',
              tab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-ink/60 hover:text-ink'
            )}
          >
            <Icon size={17} aria-hidden="true" />
            {t(`coord.tabs.${key}`)}
          </button>
        ))}
      </div>

      {tab === 'capabilities' && <CapabilitiesTab readOnly={readOnly} />}
      {tab === 'neighbours' && <NeighboursTab />}
      {tab === 'outgoing' && <OutgoingTab readOnly={readOnly} />}
      {tab === 'incoming' && <IncomingTab readOnly={readOnly} />}
    </div>
  );
}
