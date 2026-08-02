/**
 * Client-side CSV export. Serialises an array of rows to CSV and triggers a
 * download. `columns` is `[{ key, header }]`; values are read from each row.
 *
 * @param {string} filename
 * @param {Array<{key:string, header:string}>} columns
 * @param {Array<object>} rows
 */
export function exportCsv(filename, columns, rows) {
  const escape = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map((c) => escape(c.header)).join(',');
  const body = rows
    .map((row) => columns.map((c) => escape(typeof c.value === 'function' ? c.value(row) : row[c.key])).join(','))
    .join('\n');
  const csv = `${header}\n${body}`;

  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
