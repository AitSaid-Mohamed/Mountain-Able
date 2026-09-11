import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Map as MapIcon, ChevronDown } from 'lucide-react';
import Container from '../components/layout/Container.jsx';
import { Select, Pagination, EmptyState, ErrorState, Button } from '../components/ui/index.js';
import VillageCard from '../components/villages/VillageCard.jsx';
import VillageCardSkeleton from '../components/villages/VillageCardSkeleton.jsx';
import VillageSearchBar from '../components/villages/VillageSearchBar.jsx';
import VillagesMap from '../components/villages/VillagesMap.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useDebounce } from '../hooks/useDebounce.js';

const LIMIT = 8;
const DEFAULT_SORT = '-rating';

export default function VillagesPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();

  // URL is the source of truth for all filters/sort/page.
  const search = params.get('search') ?? '';
  const region = params.get('region') ?? '';
  const minRating = params.get('minRating') ?? '';
  const category = params.get('category') ?? '';
  const sort = params.get('sort') ?? DEFAULT_SORT;
  const page = Math.max(1, parseInt(params.get('page') ?? '1', 10) || 1);

  // Local, debounced search input so typing doesn't spam the URL/API.
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounce(searchInput, 400);
  useEffect(() => {
    if (debouncedSearch !== search) setParam({ search: debouncedSearch || undefined, page: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const [hovered, setHovered] = useState(null);
  const [showMapMobile, setShowMapMobile] = useState(false);

  const setParam = useCallback(
    (patch) => {
      const next = new URLSearchParams(params);
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === '' || v === null) next.delete(k);
        else next.set(k, v);
      }
      setParams(next, { replace: true });
    },
    [params, setParams]
  );

  // The filters both the grid and the map are drawn from. Kept separate from
  // sort/page so that paging or re-sorting does not refetch the map: neither
  // changes which villages match, only their order and which slice is shown.
  const filterParams = useMemo(
    () => ({
      ...(search && { search }),
      ...(region && { region }),
      ...(minRating && { minRating }),
      ...(category && { category }),
    }),
    [search, region, minRating, category]
  );

  const apiParams = useMemo(
    () => ({ ...filterParams, sort, page, limit: LIMIT }),
    [filterParams, sort, page]
  );

  const { data: villages, meta, loading, error, refetch } = useFetch('/villages', { params: apiParams });
  // Same filters, no pagination: the grid shows one page, the map shows every
  // match. `useFetch` serialises params to a stable key, so this fires exactly
  // once per filter change and not at all when only sort or page changes.
  const {
    data: mapVillages,
    loading: mapLoading,
    error: mapError,
  } = useFetch('/villages/map', { params: filterParams });
  const { data: municipalities } = useFetch('/municipalities');

  const regions = useMemo(() => {
    const set = new Set((municipalities ?? []).map((m) => m.region));
    return [...set].sort();
  }, [municipalities]);

  const hasFilters = Boolean(search || region || minRating || category || sort !== DEFAULT_SORT);
  const clearFilters = () => {
    setSearchInput('');
    setParams({}, { replace: true });
  };

  // One definition, rendered in both the mobile drawer and the desktop aside.
  // The map mirrors the grid's states: when a filter matches nothing there are
  // no markers to draw, so an empty Leaflet canvas would read as a broken map.
  // The empty state fills the panel but is top-aligned rather than centred in
  // it, so it sits at the same height as the grid's empty state beside it.
  const mapPanel = mapError ? (
    <ErrorState error={mapError} />
  ) : !mapLoading && mapVillages?.length === 0 ? (
    // The wrapper carries the panel height, not the EmptyState: `cn` is a plain
    // join, so a `justify-start` on the component would lose to its own
    // `justify-center`. Letting it size to its content inside a full-height box
    // puts it at the top, level with the grid's empty state.
    <div className="h-full bg-cream">
      <EmptyState
        icon={MapIcon}
        title={t('villages.mapNoResults')}
        description={t('villages.mapNoResultsHint')}
        className="px-6"
      />
    </div>
  ) : (
    <VillagesMap villages={mapVillages ?? []} highlightId={hovered} />
  );

  const sortOptions = [
    { value: '-rating', label: t('villages.sort.ratingDesc') },
    { value: 'rating', label: t('villages.sort.ratingAsc') },
    { value: 'name', label: t('villages.sort.nameAsc') },
    { value: '-name', label: t('villages.sort.nameDesc') },
    { value: 'newest', label: t('villages.sort.newest') },
  ];

  return (
    <Container className="py-10">
      <h1 className="sr-only">{t('villages.title')}</h1>

      <VillageSearchBar
        values={{ search: searchInput, region, minRating }}
        regions={regions}
        onChange={(patch) => {
          if ('search' in patch) setSearchInput(patch.search);
          else setParam({ ...patch, page: undefined });
        }}
        onSubmit={() => setParam({ search: searchInput || undefined, page: undefined })}
        onClear={clearFilters}
        hasFilters={hasFilters}
      />

      {/* Total + sort */}
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <h2 className="shrink-0 text-h3 text-ink">
          {t('villages.totalVillages')} : {meta?.total ?? '—'}
        </h2>
        <span className="hidden h-px flex-1 bg-ink/15 sm:block" aria-hidden="true" />
        <div className="w-full sm:w-52">
          <Select
            aria-label={t('villages.sortBy')}
            icon={ChevronDown}
            options={sortOptions}
            value={sort}
            onChange={(e) => setParam({ sort: e.target.value, page: undefined })}
          />
        </div>
      </div>

      {/* Mobile map toggle */}
      <div className="mt-4 lg:hidden">
        <Button variant="outline" size="sm" onClick={() => setShowMapMobile((s) => !s)}>
          <MapIcon size={16} />
          {showMapMobile ? t('villages.hideMap') : t('villages.showMap')}
        </Button>
        {showMapMobile && (
          <div className="mt-3 h-72 overflow-hidden rounded-card shadow-card">
            {mapPanel}
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        {/* Grid */}
        <div className="min-w-0 flex-1">
          {error ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : loading ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {Array.from({ length: LIMIT }).map((_, i) => (
                <VillageCardSkeleton key={i} />
              ))}
            </div>
          ) : villages?.length === 0 ? (
            <EmptyState
              title={t('villages.noResults')}
              description={t('villages.noResultsHint')}
              action={
                hasFilters && (
                  <Button variant="outline" onClick={clearFilters}>
                    {t('villages.clearFilters')}
                  </Button>
                )
              }
            />
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2">
                {villages.map((v) => (
                  <VillageCard
                    key={v._id}
                    village={v}
                    onMouseEnter={() => setHovered(v._id)}
                    onMouseLeave={() => setHovered(null)}
                  />
                ))}
              </div>
              <div className="mt-10">
                <Pagination
                  page={page}
                  totalPages={meta?.totalPages ?? 1}
                  onChange={(p) => setParam({ page: p === 1 ? undefined : String(p) })}
                />
              </div>
            </>
          )}
        </div>

        {/* Sticky map (desktop) */}
        <aside className="hidden w-[396px] shrink-0 lg:block">
          <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-hidden rounded-card shadow-card">
            {mapPanel}
          </div>
        </aside>
      </div>
    </Container>
  );
}
