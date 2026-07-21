// Domain logic for Gestione Personale. Hard rule: this module never computes
// payroll or contributions — only records data, aggregates it, and raises
// alerts. Every estimated figure (TFR) carries TFR_DISCLAIMER verbatim.
import { addMonths, daysUntil } from "@/lib/compliance";

export const TFR_DISCLAIMER =
  "Stima indicativa, non un valore ufficiale: il TFR effettivo è calcolato dal consulente del lavoro sul cedolino paga.";

export const COMPORTO_DISCLAIMER =
  "Il limite di comporto varia per CCNL e anzianità di servizio: il valore qui sotto è impostato manualmente e va sempre verificato con il consulente del lavoro.";

export type SemaforoStato = "OK" | "IN_SCADENZA" | "SCADUTO";

/** Gestione Personale uses a wider 90/30-day window than the rest of the app
 * (30gg only) — deadlines here (visite mediche, formazioni) need more lead time. */
export function scadenzaPersonaleStato(dataScadenza: Date | null | undefined): {
  giorni: number | null;
  stato: SemaforoStato;
} {
  if (!dataScadenza) return { giorni: null, stato: "OK" };
  const giorni = daysUntil(dataScadenza);
  if (giorni === null) return { giorni: null, stato: "OK" };
  if (giorni < 0) return { giorni, stato: "SCADUTO" };
  if (giorni <= 30) return { giorni, stato: "SCADUTO" };
  if (giorni <= 90) return { giorni, stato: "IN_SCADENZA" };
  return { giorni, stato: "OK" };
}

/** Comporto: giallo al 70% del limite CCNL (configurabile), rosso al 90% o oltre. */
export function comportoStato(giorniMalattiaAnno: number, giorniComportoMassimo: number): SemaforoStato {
  if (giorniComportoMassimo <= 0) return "OK";
  const pct = giorniMalattiaAnno / giorniComportoMassimo;
  if (pct >= 0.9) return "SCADUTO";
  if (pct >= 0.7) return "IN_SCADENZA";
  return "OK";
}

/** Worst-status-wins aggregation, used for the per-employee traffic light and dashboard alerts. */
export function peggiore(stati: SemaforoStato[]): SemaforoStato {
  if (stati.includes("SCADUTO")) return "SCADUTO";
  if (stati.includes("IN_SCADENZA")) return "IN_SCADENZA";
  return "OK";
}

export function calcolaScadenzaAdempimento(dataEsecuzione: Date | null, periodicitaMesi: number | null): Date | null {
  if (!dataEsecuzione || !periodicitaMesi) return null;
  return addMonths(dataEsecuzione, periodicitaMesi);
}

export const MATURAZIONE_DISCLAIMER =
  "Stima calcolata in proporzione a orario contrattuale e periodo lavorato nell'anno: il valore ufficiale di ferie e ROL maturati è quello del consulente del lavoro/cedolino paga.";

function round05(value: number) {
  return Math.round(value * 2) / 2;
}

/** Stima ferie/ROL maturati nell'anno, in proporzione a: percentuale di part-time
 * (ore settimanali / ore settimanali a tempo pieno) e alla frazione dell'anno
 * effettivamente lavorata (tra assunzione/inizio anno e cessazione/oggi/fine anno).
 * Ritorna null se manca la data di assunzione: senza quella non si può stimare nulla. */
export function calcolaMaturazioneAnno(params: {
  anno: number;
  dataAssunzione: Date | null;
  dataFineContratto: Date | null;
  oreSettimanali: number | null;
  oreSettimanaliFullTime: number;
  ferieAnnueContrattuali: number;
  rolAnnueContrattuali: number;
}): { ferieMaturate: number; rolMaturati: number; fattoreParttime: number; percentualeAnno: number } | null {
  const { anno, dataAssunzione, dataFineContratto, oreSettimanali, oreSettimanaliFullTime, ferieAnnueContrattuali, rolAnnueContrattuali } = params;
  if (!dataAssunzione) return null;

  const inizioAnno = new Date(anno, 0, 1);
  const fineAnno = new Date(anno, 11, 31);
  const oggi = new Date();

  const effStart = dataAssunzione > inizioAnno ? dataAssunzione : inizioAnno;
  let effEnd = fineAnno;
  if (dataFineContratto && dataFineContratto < effEnd) effEnd = dataFineContratto;
  if (anno === oggi.getFullYear() && oggi < effEnd) effEnd = oggi;

  const msPerDay = 1000 * 60 * 60 * 24;
  const giorniTotaliAnno = Math.round((fineAnno.getTime() - inizioAnno.getTime()) / msPerDay) + 1;
  const giorniLavorati = Math.max(0, Math.round((effEnd.getTime() - effStart.getTime()) / msPerDay) + 1);
  const percentualeAnno = Math.min(1, giorniLavorati / giorniTotaliAnno);

  const fattoreParttime = oreSettimanali ? Math.min(1, oreSettimanali / oreSettimanaliFullTime) : 1;

  return {
    ferieMaturate: round05(ferieAnnueContrattuali * fattoreParttime * percentualeAnno),
    rolMaturati: round05(rolAnnueContrattuali * fattoreParttime * percentualeAnno),
    fattoreParttime,
    percentualeAnno,
  };
}

// SemaforoStato values ("OK" | "IN_SCADENZA" | "SCADUTO") are the same keys used
// by STATO_COLORS/STATO_LABELS in src/lib/compliance.ts — reuse <StatoBadge> as-is.

export type StimaTfr = {
  quotaLorda: number;
  contributoIvs: number;
  quotaNettaAccantonata: number;
  percentualeRivalutazione: number;
  rivalutazione: number;
  totaleStimato: number;
};

/** TFR = quota dell'anno (retribuzione / 13,5 − 0,50% IVS) + rivalutazione sul
 * pregresso (1,5% fisso + 75% dell'indice ISTAT inserito manualmente). Sempre
 * accompagnata da TFR_DISCLAIMER: non è mai il dato ufficiale. */
export function stimaTfrAnnuale(params: {
  retribuzioneUtileAnnua: number | null | undefined;
  tfrAccantonatoInizioAnno: number | null | undefined;
  indiceRivalutazioneIstat: number | null | undefined;
}): StimaTfr | null {
  const retribuzione = params.retribuzioneUtileAnnua;
  if (retribuzione === null || retribuzione === undefined) return null;

  const tfrPregresso = params.tfrAccantonatoInizioAnno ?? 0;
  const indiceIstat = params.indiceRivalutazioneIstat ?? 0;

  const quotaLorda = retribuzione / 13.5;
  const contributoIvs = retribuzione * 0.005;
  const quotaNettaAccantonata = quotaLorda - contributoIvs;
  const percentualeRivalutazione = 1.5 + 0.75 * indiceIstat;
  const rivalutazione = tfrPregresso * (percentualeRivalutazione / 100);
  const totaleStimato = tfrPregresso + quotaNettaAccantonata + rivalutazione;

  return { quotaLorda, contributoIvs, quotaNettaAccantonata, percentualeRivalutazione, rivalutazione, totaleStimato };
}

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
];

export const STATO_DIPENDENTE_OPTIONS = [
  { value: "ATTIVO", label: "Attivo" },
  { value: "CESSATO", label: "Cessato" },
];

export const TIPO_ASSENZA_OPTIONS = [
  { value: "FERIE", label: "Ferie" },
  { value: "ROL", label: "ROL" },
  { value: "PERMESSO", label: "Permesso" },
  { value: "MALATTIA", label: "Malattia" },
  { value: "INFORTUNIO", label: "Infortunio" },
  { value: "MATERNITA", label: "Maternità" },
  { value: "CONGEDO", label: "Congedo" },
  { value: "ASPETTATIVA", label: "Aspettativa" },
];

export const TIPOLOGIA_ADEMPIMENTO_OPTIONS = [
  { value: "FORMAZIONE_GENERALE_81_08", label: "Formazione generale 81/08" },
  { value: "FORMAZIONE_SPECIFICA", label: "Formazione specifica" },
  { value: "AGGIORNAMENTO_QUINQUENNALE", label: "Aggiornamento quinquennale" },
  { value: "PRIMO_SOCCORSO", label: "Primo soccorso" },
  { value: "ANTINCENDIO", label: "Antincendio" },
  { value: "RLS", label: "RLS" },
  { value: "PREPOSTO", label: "Preposto" },
  { value: "VISITA_MEDICO_COMPETENTE", label: "Visita medico competente" },
  { value: "VACCINAZIONE_HBV", label: "Vaccinazione HBV" },
  { value: "DOSIMETRIA", label: "Dosimetria" },
  { value: "VISITA_MEDICO_RADIOPROTEZIONE", label: "Visita medico autorizzato radioprotezione" },
  { value: "CONSEGNA_DPI", label: "Consegna DPI" },
  { value: "NOMINA_AUTORIZZATO_GDPR", label: "Nomina autorizzato GDPR" },
  { value: "FORMAZIONE_GDPR", label: "Formazione GDPR" },
  { value: "CONSEGNA_DVR", label: "Consegna DVR" },
];

export function optionLabel(options: { value: string; label: string }[], value: string) {
  return options.find((o) => o.value === value)?.label ?? value;
}

export const DIPENDENTE_CSV_HEADERS = [
  "nome",
  "cognome",
  "codiceFiscale",
  "dataNascita",
  "mansione",
  "tipoContratto",
  "ccnl",
  "livello",
  "dataAssunzione",
  "dataFineContratto",
  "oreSettimanali",
  "finePeriodoProva",
  "stato",
  "note",
  "oreSettimanaliFullTime",
  "ferieAnnueContrattuali",
  "rolAnnueContrattuali",
  "retribuzioneLordaAnnua",
];
