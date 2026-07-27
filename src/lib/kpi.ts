export const MESI_LABELS = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

export const MESI_LABELS_BREVI = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

/** Data -> "AAAA-MM-GG" in UTC: usato per confrontare/raggruppare per giorno senza
 * dipendere dal fuso orario del processo (le date arrivano da <input type="date">,
 * ancorate a mezzanotte UTC). */
export function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export type KpiRiga = {
  data: Date;
  numeroPrimeVisite: number;
  numeroAppuntamenti: number;
  fatturato: number;
  valorePreventiviPresentati: number;
  valorePreventiviAccettati: number;
};

export function tassoConversionePreventivi(presentati: number, accettati: number): number | null {
  if (presentati <= 0) return null;
  return Math.round((accettati / presentati) * 100);
}

/** Somma i valori di un insieme di righe KPI (usato per un mese o un anno intero). */
export function sommaKpi(righe: KpiRiga[]) {
  return righe.reduce(
    (acc, r) => ({
      numeroPrimeVisite: acc.numeroPrimeVisite + r.numeroPrimeVisite,
      numeroAppuntamenti: acc.numeroAppuntamenti + r.numeroAppuntamenti,
      fatturato: acc.fatturato + r.fatturato,
      valorePreventiviPresentati: acc.valorePreventiviPresentati + r.valorePreventiviPresentati,
      valorePreventiviAccettati: acc.valorePreventiviAccettati + r.valorePreventiviAccettati,
    }),
    { numeroPrimeVisite: 0, numeroAppuntamenti: 0, fatturato: 0, valorePreventiviPresentati: 0, valorePreventiviAccettati: 0 }
  );
}

/** Righe del mese corrente raggruppate per giorno, per il grafico a colonne del fatturato giornaliero. */
export function fatturatoPerGiorno(righe: KpiRiga[], anno: number, mese: number) {
  return righe
    .filter((r) => r.data.getUTCFullYear() === anno && r.data.getUTCMonth() === mese)
    .sort((a, b) => a.data.getTime() - b.data.getTime())
    .map((r) => ({ label: String(r.data.getUTCDate()), value: r.fatturato }));
}

/** Righe dell'anno raggruppate per mese, per i grafici di riepilogo annuale. */
export function riepilogoPerMese(righe: KpiRiga[], anno: number) {
  const perMese = Array.from({ length: 12 }, () => [] as KpiRiga[]);
  for (const r of righe) {
    if (r.data.getUTCFullYear() === anno) perMese[r.data.getUTCMonth()].push(r);
  }
  return perMese.map((righeMese, i) => ({ mese: i, label: MESI_LABELS_BREVI[i], ...sommaKpi(righeMese) }));
}

/** Ultimi `giorni` giorni (oggi incluso), sempre visibili indipendentemente dal
 * cambio di mese: risolve il caso in cui il grafico "del mese corrente" si
 * svuota di colpo a inizio mese nascondendo i dati dei giorni precedenti. */
export function fatturatoUltimiGiorni(righe: KpiRiga[], giorni: number, oggi: Date = new Date()) {
  const oggiIso = toIsoDate(oggi);
  const perData = new Map(righe.map((r) => [toIsoDate(r.data), r]));
  return Array.from({ length: giorni }, (_, i) => {
    const d = new Date(oggi);
    d.setUTCDate(d.getUTCDate() - (giorni - 1 - i));
    const iso = toIsoDate(d);
    const r = perData.get(iso);
    return { label: String(d.getUTCDate()), value: r?.fatturato ?? 0, isOggi: iso === oggiIso };
  });
}
