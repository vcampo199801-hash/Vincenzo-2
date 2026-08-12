// Modulo Spese / Diario titolare: voci di spesa libere (affitto, utenze, ecc.)
// inserite manualmente, usate per il riepilogo in dashboard — non è una
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

/** Etichetta leggibile per la cadenza: null -> "—", altrimenti "Mensile" /
 * "Trimestrale" / "Semestrale" / "Annuale" per i valori più comuni, o "Ogni N mesi". */
export function ricorrenzaLabel(ricorrenzaMesi: number | null | undefined): string {
  if (!ricorrenzaMesi) return "—";
  if (ricorrenzaMesi === 1) return "Mensile";
  if (ricorrenzaMesi === 3) return "Trimestrale";
  if (ricorrenzaMesi === 6) return "Semestrale";
  if (ricorrenzaMesi === 12) return "Annuale";
  return `Ogni ${ricorrenzaMesi} mesi`;
}

/** Costo annuo di una spesa ricorrente proiettato dalla sua cadenza
 * (es. 100€ ogni 2 mesi -> 100 * 12/2 = 600€/anno). Una spesa una tantum
 * "costa" semplicemente il suo importo. */
export function costoAnnualizzato(importo: number, ricorrenzaMesi: number | null | undefined): number {
  if (!ricorrenzaMesi || ricorrenzaMesi <= 0) return importo;
  return importo * (12 / ricorrenzaMesi);
}

export type SpesaRiga = { data: Date; categoria: string; importo: number; ricorrenzaMesi?: number | null };

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

/** Stima di quanto costerà l'anno "a regime": le spese ricorrenti vengono
 * proiettate sull'intero anno in base alla loro cadenza (inserite una sola
 * volta come definizione, non una riga per ogni occorrenza); le spese una
 * tantum contano per l'importo effettivo se datate nell'anno indicato. */
export function costoAnnuoProiettato(righe: SpesaRiga[], anno: number): number {
  let totale = 0;
  for (const r of righe) {
    if (r.ricorrenzaMesi) {
      totale += costoAnnualizzato(r.importo, r.ricorrenzaMesi);
    } else if (r.data.getUTCFullYear() === anno) {
      totale += r.importo;
    }
  }
  return totale;
}
