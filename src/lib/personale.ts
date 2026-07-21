// Modulo Personale: NON un gestionale HR. Registra solo lo stato
// anagrafico-contrattuale e i valori economici inseriti manualmente dal
// titolare (dai prospetti del consulente del lavoro), più l'archivio cedolini.
// Nessuna gestione di ferie/permessi/ROL/ore lavorate/presenze, nessun calcolo
// di contributi/TFR/netto in busta.
import { daysUntil } from "@/lib/compliance";

export const MANSIONE_OPTIONS = [
  { value: "ASO", label: "ASO" },
  { value: "IGIENISTA", label: "Igienista" },
  { value: "ODONTOIATRA_COLLABORATORE", label: "Odontoiatra collaboratore" },
  { value: "SEGRETARIA", label: "Segretaria" },
  { value: "ALTRO", label: "Altro" },
];

export const TIPO_CONTRATTO_OPTIONS = [
  { value: "INDETERMINATO", label: "Indeterminato" },
  { value: "DETERMINATO", label: "Determinato" },
  { value: "APPRENDISTATO", label: "Apprendistato" },
  { value: "TIROCINIO", label: "Tirocinio" },
  { value: "LIBERO_PROFESSIONISTA", label: "Libero professionista" },
];

export const STATO_DIPENDENTE_OPTIONS = [
  { value: "ATTIVO", label: "Attivo" },
  { value: "CESSATO", label: "Cessato" },
];

export function optionLabel(options: { value: string; label: string }[], value: string) {
  return options.find((o) => o.value === value)?.label ?? value;
}

export type ContrattoStato = "OK" | "IN_SCADENZA" | "SCADUTO";

/** Stato della scadenza contratto, finestra 30 giorni come nel resto dell'app. */
export function contrattoStato(dataScadenzaContratto: Date | null | undefined): {
  giorni: number | null;
  stato: ContrattoStato;
} {
  if (!dataScadenzaContratto) return { giorni: null, stato: "OK" };
  const giorni = daysUntil(dataScadenzaContratto);
  if (giorni === null) return { giorni: null, stato: "OK" };
  if (giorni < 0) return { giorni, stato: "SCADUTO" };
  if (giorni <= 30) return { giorni, stato: "IN_SCADENZA" };
  return { giorni, stato: "OK" };
}

export const MESI_LABELS_BREVI = [
  "Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic",
];

export function isCedolinoStorageConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}
