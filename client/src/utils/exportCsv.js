/**
 * exportCsv.js
 * Client-side CSV export utility. Takes an array of plain objects and a
 * filename, converts them to a CSV string, and triggers a browser download
 * via a Blob URL — no server round-trip needed.
 *
 * @param {Record<string, unknown>[]} rows  - Array of flat objects (all same shape)
 * @param {string} filename                 - Desired filename, e.g. "weekly-stats.csv"
 */
export function exportCsv(rows, filename) {
  if (!rows || rows.length === 0) return;

  const headers = Object.keys(rows[0]);

  // Escape a cell value: wrap in quotes if it contains comma, quote, or newline
  const escapeCell = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvLines = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => headers.map((h) => escapeCell(row[h])).join(',')),
  ];

  const csvString = csvLines.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the object URL after the download is triggered
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
