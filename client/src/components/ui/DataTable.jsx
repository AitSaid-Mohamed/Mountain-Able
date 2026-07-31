import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from './Card.jsx';
import Spinner from './Spinner.jsx';
import EmptyState from './EmptyState.jsx';
import { cn } from '../../lib/utils.js';

/**
 * Generic sortable, client-paginated table for the dashboards.
 *
 * @param {Array}  columns  [{ key, header, sortable?, render?(row), className? }]
 * @param {Array}  rows
 * @param {boolean} loading
 * @param {number} pageSize
 */
export default function DataTable({ columns, rows = [], loading = false, pageSize = 10, emptyTitle }) {
  const { t } = useTranslation();
  const [sort, setSort] = useState({ key: null, dir: 'asc' });
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    if (!sort.key) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [rows, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, totalPages);
  const pageRows = sorted.slice((current - 1) * pageSize, current * pageSize);

  const toggleSort = (key) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));

  if (loading) {
    return (
      <Card className="flex items-center justify-center py-16 text-ink/50">
        <Spinner size={24} />
      </Card>
    );
  }

  if (rows.length === 0) {
    return (
      <Card className="p-4">
        <EmptyState title={emptyTitle ?? t('dashboard.noData')} />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-body">
          <thead>
            <tr className="border-b border-ink/10 bg-black/[0.02] text-small text-ink/60">
              {columns.map((col) => (
                <th key={col.key} className={cn('px-4 py-3 font-medium', col.className)}>
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-ink"
                    >
                      {col.header}
                      {sort.key === col.key ? (
                        sort.dir === 'asc' ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )
                      ) : (
                        <ChevronsUpDown size={14} className="opacity-40" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr key={row._id ?? i} className="border-b border-ink/5 last:border-0 hover:bg-black/[0.02]">
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3 align-middle', col.className)}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 text-small text-ink/60">
          <span>
            {current} / {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={current === 1}
              onClick={() => setPage(current - 1)}
              className="rounded-pill px-3 py-1 disabled:opacity-40 hover:bg-black/5"
            >
              ‹
            </button>
            <button
              type="button"
              disabled={current === totalPages}
              onClick={() => setPage(current + 1)}
              className="rounded-pill px-3 py-1 disabled:opacity-40 hover:bg-black/5"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
