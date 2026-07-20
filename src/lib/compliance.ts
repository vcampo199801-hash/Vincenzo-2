// Domain helpers that mirror the formulas of the original Excel workbook
// (Scadenzario, Magazzino, Farmaci, ECM, Documenti).

export function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function daysUntil(date: Date | null | undefined, from: Date = new Date()) {
  if (!date) return null;
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export type ScadenzaStato = "DA_COMPILARE" | "OK" | "IN_SCADENZA" | "SCADUTO";

/** Mirrors the Scadenzario "Stato" column: OK / IN SCADENZA (<=30gg) / SCADUTO / Da compilare. */
export function scadenzaStato(
  dataUltimoControllo: Date | null | undefined,
  mesi: number,
  soglia = 30
): { prossimaScadenza: Date | null; giorni: number | null; stato: ScadenzaStato } {
  if (!dataUltimoControllo) {
    return { prossimaScadenza: null, giorni: null, stato: "DA_COMPILARE" };
  }
  const prossimaScadenza = addMonths(dataUltimoControllo, mesi);
  const giorni = daysUntil(prossimaScadenza);
  let stato: ScadenzaStato = "OK";
  if (giorni !== null) {
    if (giorni < 0) stato = "SCADUTO";
    else if (giorni <= soglia) stato = "IN_SCADENZA";
  }
  return { prossimaScadenza, giorni, stato };
}

export type ScortaStato = "OK" | "SCORTA_BASSA" | "DA_RIORDINARE";

/** Mirrors the Magazzino "Stato scorta" column. */
export function scortaStato(scortaMinima: number, quantitaAttuale: number): ScortaStato {
  if (quantitaAttuale <= scortaMinima) return "DA_RIORDINARE";
  if (quantitaAttuale <= scortaMinima * 1.5) return "SCORTA_BASSA";
  return "OK";
}

export type LottoStato = "OK" | "IN_SCADENZA" | "SCADUTO" | null;

/** Mirrors the Magazzino/Farmaci "Stato lotto" column (90-day warning window). */
export function lottoStato(scadenza: Date | null | undefined, soglia = 90): LottoStato {
  if (!scadenza) return null;
  const giorni = daysUntil(scadenza);
  if (giorni === null) return null;
  if (giorni < 0) return "SCADUTO";
  if (giorni <= soglia) return "IN_SCADENZA";
  return "OK";
}

export function ecmPercent(crediti2026: number, crediti2027: number, crediti2028: number, target: number) {
  const totale = crediti2026 + crediti2027 + crediti2028;
  const mancanti = Math.max(target - totale, 0);
  const percentuale = target > 0 ? Math.min(totale / target, 1) : 0;
  return { totale, mancanti, percentuale };
}

export const STATO_LABELS: Record<string, string> = {
  DA_COMPILARE: "Da compilare",
  OK: "In regola",
  IN_SCADENZA: "In scadenza",
  SCADUTO: "Scaduto",
  SCORTA_BASSA: "Scorta bassa",
  DA_RIORDINARE: "Da riordinare",
  PRESENTE: "Presente",
  DA_AGGIORNARE: "Da aggiornare",
  MANCANTE: "Mancante",
};

export const STATO_COLORS: Record<string, string> = {
  DA_COMPILARE: "bg-slate-100 text-slate-600 border-slate-200",
  OK: "bg-emerald-50 text-emerald-700 border-emerald-200",
  IN_SCADENZA: "bg-amber-50 text-amber-700 border-amber-200",
  SCADUTO: "bg-red-50 text-red-700 border-red-200",
  SCORTA_BASSA: "bg-amber-50 text-amber-700 border-amber-200",
  DA_RIORDINARE: "bg-red-50 text-red-700 border-red-200",
  PRESENTE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DA_AGGIORNARE: "bg-amber-50 text-amber-700 border-amber-200",
  MANCANTE: "bg-red-50 text-red-700 border-red-200",
};

export function formatDate(date: Date | null | undefined) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value);
}

export const PERIODICITA_OPTIONS = [
  { label: "Mensile", mesi: 1 },
  { label: "Trimestrale", mesi: 3 },
  { label: "Semestrale", mesi: 6 },
  { label: "Annuale", mesi: 12 },
  { label: "Biennale", mesi: 24 },
  { label: "Triennale", mesi: 36 },
  { label: "Quinquennale", mesi: 60 },
];

export const MAGAZZINO_CATEGORIE = [
  "Sterilizzazione / Disinfezione",
  "Monouso / DPI",
  "Materiali da impronta",
  "Conservativa / Adesivi",
  "Endodonzia",
  "Implantologia / Chirurgia",
  "Anestetici",
  "Farmaci / Emergenza",
  "Igiene / Profilassi",
  "Altro",
];

export const MESI_LABELS = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];
