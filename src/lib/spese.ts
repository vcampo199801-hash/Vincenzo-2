// Modulo Spese / Diario titolare: voci di spesa libere (affitto, utenze, ecc.)
// inserite manualmente, usate solo per il riepilogo in dashboard — non è una
// contabilità o fatturazione.

export const CATEGORIA_SPESA_OPTIONS = [
  { value: "AFFITTO", label: "Affitto / mutuo studio" },
  { value: "UTENZE", label: "Utenze (luce, gas, acqua, internet)" },
  { value: "PERSONALE_ESTERNO", label: "Collaboratori esterni / consulenti" },
  { value: "MATERIALI_NON_SANITARI", label: "Materiali e cancelleria" },
  { value: "MANUTENZIONE_ATTREZZATURE", label: "Manutenzione attrezzature" },
  { value: "ASSICURAZIONI", label: "Assicurazioni" },
  { value: "TASSE_CONTRIBUTI", label: "Tasse e contributi" },
  { value: "MARKETING", label: "Marketing e comunicazione" },
  { value: "ALTRO", label: "Altro" },
];

export function optionLabel(options: { value: string; label: string }[], value: string) {
  return options.find((o) => o.value === value)?.label ?? value;
}

export type SpesaRiga = { data: Date; categoria: string; importo: number };

export function totaleSpese(righe: SpesaRiga[]) {
  return righe.reduce((sum, r) => sum + r.importo, 0);
}

/** Ripartizione per categoria (ordinata per importo decrescente), per il donut di riepilogo. */
export function sommaPerCategoria(righe: SpesaRiga[]) {
  const perCategoria = new Map<string, number>();
  for (const r of righe) {
    perCategoria.set(r.categoria, (perCategoria.get(r.categoria) ?? 0) + r.importo);
  }
  return [...perCategoria.entries()]
    .map(([categoria, importo]) => ({ categoria, importo }))
    .sort((a, b) => b.importo - a.importo);
}

export function speseDelMese(righe: SpesaRiga[], anno: number, mese: number) {
  return righe.filter((r) => r.data.getUTCFullYear() === anno && r.data.getUTCMonth() === mese);
}

export function speseDellAnno(righe: SpesaRiga[], anno: number) {
  return righe.filter((r) => r.data.getUTCFullYear() === anno);
}
