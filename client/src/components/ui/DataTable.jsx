import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from './Card.jsx';
import Skeleton from './Skeleton.jsx';
import EmptyState from './EmptyState.jsx';
import ErrorState from './ErrorState.jsx';
import Pagination from './Pagination.jsx';
import { cn } from '../../lib/utils.js';

/**
 * The single dashboard table implementation. Handles: loading skeleton rows,
 * empty and error(+retry) states, column sorting (controlled via `sort`/
 * `onSortChange` so the caller can persist it in the URL, or internal), and
 * pagination (server-side when `page`/`totalPages`/`onPageChange` are given,
 * otherwise client-side). Below `md` each row renders as a stacked card.
 *
 * @param {Array} columns  [{ key, header, sortable?, render?(row), className?, cardHidden? }]
 */
export default function DataTable({
  columns,
  rows = [],
  loading = false,
  error = null,
  onRetry,
  emptyTitle,
  emptyDescription,
  emptyAction,
  rowKey = (r) => r._id,
  // sorting (controlled optional)
  sort,
  onSortChange,
  // server pagination (optional)
  page,
  totalPages,
  onPageChange,
  pageSize = 10,
  // selection (optional)
  selectable = false,
  selectedIds = [],
  onToggleSelect,
  onToggleAll,
}) {
  const { t } = useTranslation();
  const [internalSort, setInternalSort] = useState({ key: null, dir: 'asc' });
  const [internalPage, setInternalPage] = useState(1);
  const serverPaginated = typeof page === 'number' && typeof onPageChange === 'function';
  const activeSort = sort ?? internalSort;

  const toggleSort = (key) => {
    const next = { key, dir: activeSort.key === key && activeSort.dir === 'asc' ? 'desc' : 'asc' };
    (onSortChange ?? setInternalSort)(next);
  };

  // Client-side sort/paginate only when not server-driven.
  const view = useMemo(() => {
    let data = rows;
    if (!onSortChange && internalSort.key) {
      data = [...rows].sort((a, b) => {
        const av = a[internalSort.key];
        const bv = b[internalSort.key];
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
        return internalSort.dir === 'asc' ? cmp : -cmp;
      });
    }
    return data;
  }, [rows, internalSort, onSortChange]);

  const clientTotalPages = Math.max(1, Math.ceil(view.length / pageSize));
  const curPage = serverPaginated ? page : Math.min(internalPage, clientTotalPages);
  const pageRows = serverPaginated ? view : view.slice((curPage - 1) * pageSize, curPage * pageSize);
  const pages = serverPaginated ? totalPages : clientTotalPages;

  const allSelected = selectable && pageRows.length > 0 && pageRows.every((r) => selectedIds.includes(rowKey(r)));

  if (error) {
    return (
      <Card className="p-2">
        <ErrorState error={error} onRetry={onRetry} />
      </Card>
    );
  }

  const SortHead = ({ col }) =>
    col.sortable ? (
      <button type="button" onClick={() => toggleSort(col.key)} className="inline-flex items-center gap-1 hover:text-ink">
        {col.header}
        {activeSort.key === col.key ? (
          activeSort.dir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
        ) : (
          <ChevronsUpDown size={14} className="opacity-40" />
        )}
      </button>
    ) : (
      col.header
    );

  return (
    <Card className="overflow-hidden">
      {/* Desktop / tablet table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-body">
          <thead>
            <tr className="border-b border-ink/10 bg-black/[0.02] text-small text-ink/60">
              {selectable && (
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={allSelected} onChange={() => onToggleAll(pageRows)} aria-label="Select all" />
                </th>
              )}
              {columns.map((col) => (
                <th key={col.key} className={cn('px-4 py-3 font-medium', col.className)}>
                  <SortHead col={col} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-ink/5">
                  {selectable && <td className="px-4 py-3"><Skeleton className="h-4 w-4" /></td>}
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3"><Skeleton className="h-4 w-full max-w-[140px]" /></td>
                  ))}
                </tr>
              ))
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)}>
                  <EmptyState title={emptyTitle ?? t('dashboard.noData')} description={emptyDescription} action={emptyAction} />
                </td>
              </tr>
            ) : (
              pageRows.map((row, ri) => (
                <tr key={rowKey(row) ?? ri} className="border-b border-ink/5 last:border-0 hover:bg-black/[0.02]">
                  {selectable && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(rowKey(row))}
                        onChange={() => onToggleSelect(rowKey(row))}
                        aria-label="Select row"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-4 py-3 align-middle', col.className)}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <div className="divide-y divide-ink/5 md:hidden">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2 p-4">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))
        ) : pageRows.length === 0 ? (
          <EmptyState title={emptyTitle ?? t('dashboard.noData')} description={emptyDescription} action={emptyAction} />
        ) : (
          pageRows.map((row, ri) => (
            <div key={rowKey(row) ?? ri} className="space-y-1.5 p-4">
              {columns.filter((c) => !c.cardHidden).map((col) => (
                <div key={col.key} className="flex justify-between gap-3 text-small">
                  <span className="shrink-0 font-medium text-ink/50">{col.header}</span>
                  <span className="text-right text-ink">{col.render ? col.render(row) : row[col.key]}</span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {!loading && pages > 1 && (
        <div className="flex justify-center border-t border-ink/5 px-4 py-4">
          <Pagination page={curPage} totalPages={pages} onChange={serverPaginated ? onPageChange : setInternalPage} />
        </div>
      )}
    </Card>
  );
}
