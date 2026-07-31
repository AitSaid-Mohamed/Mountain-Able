import { useTranslation } from 'react-i18next';
import { Type, MapPin, Filter, Search, X } from 'lucide-react';
import { Input, Select } from '../ui/index.js';

/**
 * Villages search/filter row. Rebuilt from the Figma booking-template leftover
 * (Location / Date / Guests / Submit) into meaningful filters for this
 * platform: Name, Region, Minimum rating. Keeps the pill-input visual style.
 */
export default function VillageSearchBar({ values, regions = [], onChange, onSubmit, onClear, hasFilters }) {
  const { t } = useTranslation();

  const ratingOptions = [
    { value: '', label: t('villages.anyRating') },
    { value: '3', label: t('villages.rating3') },
    { value: '4', label: t('villages.rating4') },
    { value: '4.5', label: t('villages.rating45') },
  ];
  const regionOptions = [
    { value: '', label: t('villages.anyRegion') },
    ...regions.map((r) => ({ value: r, label: r })),
  ];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className="rounded-card bg-white p-4 shadow-input"
    >
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-end">
        <Input
          label={t('villages.searchName')}
          icon={Type}
          placeholder={t('villages.searchNamePlaceholder')}
          value={values.search}
          onChange={(e) => onChange({ search: e.target.value })}
        />
        <Select
          label={t('villages.region')}
          icon={MapPin}
          options={regionOptions}
          value={values.region}
          onChange={(e) => onChange({ region: e.target.value })}
        />
        <Select
          label={t('villages.minRating')}
          icon={Filter}
          options={ratingOptions}
          value={values.minRating}
          onChange={(e) => onChange({ minRating: e.target.value })}
        />
        <button
          type="submit"
          className="inline-flex h-[50px] items-center justify-center gap-2 rounded-pill bg-primary px-7 font-semibold text-white transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <Search size={18} aria-hidden="true" />
          {t('villages.searchSubmit')}
        </button>
      </div>

      {hasFilters && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 text-small font-medium text-ink/60 hover:text-primary"
          >
            <X size={14} aria-hidden="true" />
            {t('villages.clearFilters')}
          </button>
        </div>
      )}
    </form>
  );
}
