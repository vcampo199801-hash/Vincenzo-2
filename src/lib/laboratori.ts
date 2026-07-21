// Modulo Laboratori: tracciabilità dei rapporti con i laboratori odontotecnici
// e delle dichiarazioni di conformità dei dispositivi su misura (Reg. UE
// 2017/745, Allegato XIII). Il laboratorio non è mai un utente dell'app.
import { daysUntil } from "@/lib/compliance";

export const TIPOLOGIA_LAVORAZIONE_OPTIONS = [
  { value: "PROTESI_FISSA", label: "Protesi fissa" },
  { value: "PROTESI_MOBILE", label: "Protesi mobile" },
  { value: "ORTODONZIA", label: "Ortodonzia" },
  { value: "IMPLANTOLOGIA", label: "Implantologia" },
  { value: "CAD_CAM", label: "CAD-CAM" },
  { value: "ALTRO", label: "Altro" },
];

export const STATO_LABORATORIO_OPTIONS = [
  { value: "ATTIVO", label: "Attivo" },
  { value: "NON_ATTIVO", label: "Non attivo" },
];

export const STATO_LAVORAZIONE_OPTIONS = [
  { value: "INVIATO", label: "Inviato" },
  { value: "IN_LAVORAZIONE", label: "In lavorazione" },
  { value: "CONSEGNATO_STUDIO", label: "Consegnato allo studio" },
  { value: "CONSEGNATO_PAZIENTE", label: "Consegnato al paziente" },
];

/** Stile del badge di stato lavorazione: avanzamento neutro (grigio → teal),
 * verde solo quando la lavorazione è arrivata al paziente. */
export const STATO_LAVORAZIONE_STYLE: Record<string, string> = {
  INVIATO: "bg-slate-100 text-slate-600",
  IN_LAVORAZIONE: "bg-brand-100 text-brand-700",
  CONSEGNATO_STUDIO: "bg-sky-100 text-sky-700",
  CONSEGNATO_PAZIENTE: "bg-emerald-100 text-emerald-700",
};

/** Lavorazioni ancora "in corso" presso il laboratorio, cioè non ancora arrivate allo studio. */
export function isLavorazioneInCorso(stato: string): boolean {
  return stato === "INVIATO" || stato === "IN_LAVORAZIONE";
}

export const CATEGORIA_DOCUMENTO_LABORATORIO_OPTIONS = [
  { value: "VISURA", label: "Visura camerale" },
  { value: "AUTORIZZAZIONE_SANITARIA", label: "Autorizzazione sanitaria" },
  { value: "CERTIFICAZIONE", label: "Certificazione" },
  { value: "ALTRO", label: "Altro" },
];

export const CATEGORIA_ALLEGATO_LAVORAZIONE_OPTIONS = [
  { value: "DDT", label: "DDT" },
  { value: "PRESCRIZIONE", label: "Prescrizione" },
  { value: "FOTO", label: "Foto" },
  { value: "ALTRO", label: "Altro" },
];

export const CATEGORIA_DICHIARAZIONE_CONFORMITA = "DICHIARAZIONE_CONFORMITA";

export function isLaboratoriStorageConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function optionLabel(options: { value: string; label: string }[], value: string) {
  return options.find((o) => o.value === value)?.label ?? value;
}

export function parseTipologie(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function serializeTipologie(values: string[]): string {
  return JSON.stringify(values);
}

export type ConsegnaStato = "OK" | "IN_SCADENZA" | "SCADUTO";

/** Stato della consegna prevista, finestra 7 giorni. Una volta consegnata
 * (dataConsegnaEffettiva valorizzata) non genera più alert. */
export function consegnaStato(
  dataConsegnaPrevista: Date | null | undefined,
  dataConsegnaEffettiva: Date | null | undefined
): { giorni: number | null; stato: ConsegnaStato } {
  if (dataConsegnaEffettiva) return { giorni: null, stato: "OK" };
  if (!dataConsegnaPrevista) return { giorni: null, stato: "OK" };
  const giorni = daysUntil(dataConsegnaPrevista);
  if (giorni === null) return { giorni: null, stato: "OK" };
  if (giorni < 0) return { giorni, stato: "SCADUTO" };
  if (giorni <= 7) return { giorni, stato: "IN_SCADENZA" };
  return { giorni, stato: "OK" };
}

/** true se la registrazione ministeriale non risulta verificata da più di 12 mesi
 * (o non è mai stata verificata). */
export function registrazioneDaVerificare(dataUltimaVerifica: Date | null | undefined): boolean {
  if (!dataUltimaVerifica) return true;
  const giorni = daysUntil(dataUltimaVerifica);
  return giorni !== null && giorni < -365;
}

export type LavorazioneIndicatoreInput = {
  dataInvio: Date;
  dataConsegnaPrevista: Date | null;
  dataConsegnaEffettiva: Date | null;
  stato: string;
  costo: number | null;
  hasDichiarazione: boolean;
};

/** Indicatori calcolati per la scheda laboratorio: lavori/spesa dell'anno
 * corrente, puntualità e completezza delle dichiarazioni su tutto lo storico. */
export function calcolaIndicatoriLaboratorio(lavorazioni: LavorazioneIndicatoreInput[]) {
  const annoCorrente = new Date().getFullYear();
  const delAnno = lavorazioni.filter((l) => l.dataInvio.getFullYear() === annoCorrente);

  const consegnate = lavorazioni.filter((l) => l.dataConsegnaEffettiva && l.dataConsegnaPrevista);
  const puntuali = consegnate.filter((l) => l.dataConsegnaEffettiva! <= l.dataConsegnaPrevista!);

  const daDichiarare = lavorazioni.filter((l) => l.stato === "CONSEGNATO_STUDIO" || l.stato === "CONSEGNATO_PAZIENTE");
  const conDichiarazione = daDichiarare.filter((l) => l.hasDichiarazione);

  return {
    totaleLavorazioni: lavorazioni.length,
    lavoriAnno: delAnno.length,
    lavoriInCorso: lavorazioni.filter((l) => isLavorazioneInCorso(l.stato)).length,
    spesaAnno: delAnno.reduce((s, l) => s + (l.costo ?? 0), 0),
    percentualeConsegnePuntuali: consegnate.length > 0 ? Math.round((puntuali.length / consegnate.length) * 100) : null,
    percentualeDichiarazioni: daDichiarare.length > 0 ? Math.round((conDichiarazione.length / daDichiarare.length) * 100) : null,
  };
}
