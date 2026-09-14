import { daysUntil } from "@/lib/compliance";

export const TIPO_RINNOVO_OPTIONS = [
  { value: "TACITO", label: "Rinnovo tacito" },
  { value: "NON_TACITO", label: "Non si rinnova automaticamente" },
];

export function optionLabel(options: { value: string; label: string }[], value: string | null | undefined) {
  return options.find((o) => o.value === value)?.label ?? value ?? "—";
}

export { importoConIva } from "@/lib/iva";

export type ContrattoFornitoreStato = "OK" | "IN_SCADENZA" | "SCADUTO";

/** Stato della scadenza contratto fornitore, stessa finestra di 30 giorni
 * usata per i contratti del personale. Rilevante solo se il contratto
 * risulta attivo: un fornitore disattivato non deve più comparire come
 * "in scadenza". */
export function contrattoFornitoreStato(
  contrattoAttivo: boolean,
  scadenzaContratto: Date | null | undefined
): { giorni: number | null; stato: ContrattoFornitoreStato } {
  if (!contrattoAttivo || !scadenzaContratto) return { giorni: null, stato: "OK" };
  const giorni = daysUntil(scadenzaContratto);
  if (giorni === null) return { giorni: null, stato: "OK" };
  if (giorni < 0) return { giorni, stato: "SCADUTO" };
  if (giorni <= 30) return { giorni, stato: "IN_SCADENZA" };
  return { giorni, stato: "OK" };
}
