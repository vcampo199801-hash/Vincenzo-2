// Export "Excel" semplice: CSV con separatore ";" (Excel IT lo apre subito
// bene, senza dover importare/convertire nulla) invece di introdurre una
// libreria xlsx solo per un file scaricabile e riaprile ovunque.

function escapeCsvField(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (str.includes(";") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv<T extends Record<string, unknown>>(rows: T[], columns: { key: keyof T; label: string }[]): string {
  const header = columns.map((c) => escapeCsvField(c.label)).join(";");
  const lines = rows.map((row) => columns.map((c) => escapeCsvField(row[c.key])).join(";"));
  // BOM UTF-8: senza, Excel su Windows apre gli accenti (è, à, ...) come
  // caratteri illeggibili invece di interpretare il file come UTF-8.
  return "﻿" + [header, ...lines].join("\r\n");
}
