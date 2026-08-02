import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, MapPinCheck, MapPinPlus } from 'lucide-react';
import VisitDialog from './VisitDialog.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useMe } from '../../context/MeContext.jsx';
import { useModal } from '../../context/ModalContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { cn } from '../../lib/utils.js';

/**
 * Favourite + "I've been here" controls for the public village detail page.
 * Both are visible only to tourists; logged-out users see them muted and get a
 * login prompt on click. Every label frames the record as the user's own
 * declaration — the platform never detects a visit.
 */
export default function VillageOwnControls({ village }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { openLogin } = useModal();
  const toast = useToast();
  const me = useMe();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Non-tourist authenticated users (officer/admin/authority) don't get these.
  if (user && user.role !== 'tourist') return null;

  const loggedOut = !user;
  const favRecord = loggedOut ? null : me.favoriteFor(village._id);
  const visitRecord = loggedOut ? null : me.visitedFor(village._id);
  const isFav = Boolean(favRecord);
  const isVisited = Boolean(visitRecord);

  const promptLogin = () => {
    toast.info(t('village.loginToTrack'));
    openLogin();
  };

  const onFavorite = () => (loggedOut ? promptLogin() : me.toggleFavorite(village));
  const onBeenHere = () => (loggedOut ? promptLogin() : setDialogOpen(true));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onFavorite}
        aria-pressed={isFav}
        title={isFav ? t('village.unfavorite') : t('village.favorite')}
        className={cn(
          'inline-flex items-center gap-2 rounded-pill border px-4 py-2 text-small font-medium transition',
          loggedOut && 'opacity-60',
          isFav
            ? 'border-red-400 bg-red-50 text-red-600'
            : 'border-ink/20 text-ink/70 hover:border-red-300 hover:text-red-500'
        )}
      >
        <Heart size={18} fill={isFav ? 'currentColor' : 'none'} aria-hidden="true" />
        {isFav ? t('village.unfavorite') : t('village.favorite')}
      </button>

      <button
        type="button"
        onClick={onBeenHere}
        aria-pressed={isVisited}
        title={t('village.beenHere')}
        className={cn(
          'inline-flex items-center gap-2 rounded-pill border px-4 py-2 text-small font-medium transition',
          loggedOut && 'opacity-60',
          isVisited
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-ink/20 text-ink/70 hover:border-primary/50 hover:text-primary'
        )}
      >
        {isVisited ? <MapPinCheck size={18} aria-hidden="true" /> : <MapPinPlus size={18} aria-hidden="true" />}
        {isVisited ? t('village.markedVisited') : t('village.beenHere')}
      </button>

      {dialogOpen && (
        <VisitDialog village={village} record={visitRecord} onClose={() => setDialogOpen(false)} />
      )}
    </div>
  );
}
