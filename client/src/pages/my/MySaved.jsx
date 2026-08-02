import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, X } from 'lucide-react';
import VillageCard from '../../components/villages/VillageCard.jsx';
import VillageCardSkeleton from '../../components/villages/VillageCardSkeleton.jsx';
import { EmptyState, ErrorState, Button } from '../../components/ui/index.js';
import { useMe } from '../../context/MeContext.jsx';

export default function MySaved() {
  const { t } = useTranslation();
  const { favorites, loading, error, reload, removeFavorite } = useMe();

  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => <VillageCardSkeleton key={i} />)}
      </div>
    );
  }
  if (favorites.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title={t('my.savedEmpty')}
        action={<Button as={Link} to="/villages" variant="brand">{t('my.savedEmptyCta')}</Button>}
      />
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {favorites.map((f) =>
        f.villageId ? (
          <div key={f._id} className="relative">
            <button
              type="button"
              onClick={() => removeFavorite(f._id)}
              aria-label={t('village.unfavorite')}
              title={t('village.unfavorite')}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-red-500 shadow-card transition hover:bg-white"
            >
              <X size={18} />
            </button>
            <VillageCard village={f.villageId} />
          </div>
        ) : null
      )}
    </div>
  );
}
