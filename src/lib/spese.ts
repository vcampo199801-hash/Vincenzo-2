// Modulo Spese / Diario titolare: voci di spesa libere (affitto, utenze, ecc.)
// inserite manualmente, usate per il riepilogo in dashboard — non è una
// contabilità o fatturazione.

export const CATEGORIA_SPESA_OPTIONS = [
  { value: "AFFITTO", label: "Affitto / mutuo studio" },
  { value: "UTENZE", label: "Utenze (luce, gas, acqua, internet)" },
  { value: "FINANZIAMENTI", label: "Finanziamenti / Leasing (rate)" },
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
  return ricorrenzaMesi === 1
    ? "Mensile"
    : ricorrenzaMesi === 3
      ? "Trimestrale"
      : ricorrenzaMesi === 6
        ? "Semestrale"
        : ricorrenzaMesi === 12
          ? "Annuale"
          : `Ogni ${ricorrenzaMesi} mesi`;
}

/** Costo annuo di una spesa ricorrente proiettato dalla sua cadenza
 * (es. 100€ ogni 2 mesi -> 100 * 12/2 = 600€/anno). Una spesa una tantum
 * "costa" semplicemente il suo importo. */
export function costoAnnualizzato(importo: number, ricorrenzaMesi: number | null | undefined): number {
  if (!ricorrenzaMesi || ricorrenzaMesi <= 0) return importo;
  return importo * (12 / ricorrenzaMesi);
}

export type SpesaRiga = {
  data: Date;
  categoria: string;
  importo: number;
  ricorrenzaMesi?: number | null;
  dataFineRicorrenza?: Date | null;
};

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

/** Una spesa ricorrente "conta" in ogni mese in cui ricade la sua cadenza a
 * partire dal mese in cui è stata registrata — per default nessuna data di
 * fine: resta attiva finché non viene modificata o cancellata — non solo nel
 * mese in cui è stata inserita la prima volta. Se è impostata una data di
 * fine (es. l'ultima rata di un finanziamento/leasing), non conta più dopo
 * quel mese. Una spesa una tantum conta solo nel suo mese. */
export function spesaAttivaNelMese(spesa: SpesaRiga, anno: number, mese: number): boolean {
  const target = anno * 12 + mese;
  const inizio = spesa.data.getUTCFullYear() * 12 + spesa.data.getUTCMonth();
  if (target < inizio) return false;
  if (!spesa.ricorrenzaMesi) return target === inizio;
  if (spesa.dataFineRicorrenza) {
    const fine = spesa.dataFineRicorrenza.getUTCFullYear() * 12 + spesa.dataFineRicorrenza.getUTCMonth();
    if (target > fine) return false;
  }
  return (target - inizio) % spesa.ricorrenzaMesi === 0;
}

/** Quante volte una spesa ricorrente ricade in un anno specifico — usato solo
 * quando c'è una data di fine, per non proiettarla "a regime" oltre
 * l'ultima rata (vedi costoAnnuoProiettato). */
function occorrenzeNellAnno(spesa: SpesaRiga, anno: number): number {
  let occorrenze = 0;
  for (let mese = 0; mese < 12; mese++) {
    if (spesaAttivaNelMese(spesa, anno, mese)) occorrenze++;
  }
  return occorrenze;
}

/** Come speseDelMese, ma per le spese ricorrenti guarda alla cadenza invece
 * che alla data di inserimento originale — vedi spesaAttivaNelMese. */
export function speseEffettiveDelMese(righe: SpesaRiga[], anno: number, mese: number) {
  return righe.filter((r) => spesaAttivaNelMese(r, anno, mese));
}

export function speseDellAnno(righe: SpesaRiga[], anno: number) {
  return righe.filter((r) => r.data.getUTCFullYear() === anno);
}

/** Come speseEffettiveDelMese, ma su un elenco di mesi qualsiasi (es. tutti i
 * mesi di un intervallo personalizzato o di un anno intero) — usato per la
 * ripartizione per categoria su un periodo scelto liberamente. */
export function speseEffettiveNelPeriodo(righe: SpesaRiga[], mesi: { anno: number; mese: number }[]) {
  return mesi.flatMap(({ anno, mese }) => speseEffettiveDelMese(righe, anno, mese));
}

/** Il costo annuo di una singola riga per l'anno indicato: le spese
 * ricorrenti senza data di fine vengono proiettate "a regime" sull'intero
 * anno in base alla loro cadenza (un impegno aperto, che si presume continui
 * al ritmo attuale); quelle CON una data di fine (es. le rate rimaste di un
 * finanziamento/leasing) contano invece solo le occorrenze che ricadono
 * davvero in quell'anno, così da non proiettare un costo oltre l'ultima
 * rata. Le spese una tantum contano per l'importo effettivo se datate
 * nell'anno indicato. */
export function costoAnnuoRiga(r: SpesaRiga, anno: number): number {
  if (r.ricorrenzaMesi) {
    return r.dataFineRicorrenza ? r.importo * occorrenzeNellAnno(r, anno) : costoAnnualizzato(r.importo, r.ricorrenzaMesi);
  }
  return r.data.getUTCFullYear() === anno ? r.importo : 0;
}

/** Stima di quanto costerà l'anno — somma di costoAnnuoRiga per ogni voce. */
export function costoAnnuoProiettato(righe: SpesaRiga[], anno: number): number {
  return righe.reduce((totale, r) => totale + costoAnnuoRiga(r, anno), 0);
}

/** Come costoAnnuoProiettato, ma ripartito per categoria, così la torta
 * "Ripartizione per categoria" in vista Annuale coincide col totale "Costo
 * annuo stimato". */
export function costoAnnuoProiettatoPerCategoria(righe: SpesaRiga[], anno: number) {
  const perCategoria = new Map<string, number>();
  for (const r of righe) {
    const importo = costoAnnuoRiga(r, anno);
    if (importo > 0) perCategoria.set(r.categoria, (perCategoria.get(r.categoria) ?? 0) + importo);
  }
  return [...perCategoria.entries()]
    .map(([categoria, importo]) => ({ categoria, importo }))
    .sort((a, b) => b.importo - a.importo);
}
