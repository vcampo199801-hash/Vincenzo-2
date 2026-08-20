// Modulo Manutenzione staff: registro dei controlli di routine eseguiti
// dallo staff dello studio (non da un tecnico esterno — per quello vedi
// Registro controlli / ControlloLog): sterilizzazione in autoclave,
// lubrificazione manipoli, pulizia degli aspiratori, o qualsiasi altro tipo
// personalizzato creato dallo studio. Ogni voce riporta l'operatore come
// attestazione di chi l'ha eseguita. I tipi di controllo (e la cadenza attesa
// in giorni, opzionale) sono configurabili per studio — vedi TipoManutenzione.
import { daysUntil } from "@/lib/compliance";

// Tipi predefiniti creati automaticamente al primo utilizzo del modulo (vedi
// ensureTipiManutenzione in lib/actions/manutenzione.ts) — lo studio può poi
// cambiarne la cadenza o aggiungerne altri liberamente dalla voce "Altro".
//
// L'autoclave è l'unico controllo con più test distinti (ognuno con la
// propria cadenza e il proprio promemoria): la chiave con prefisso
// "AUTOCLAVE_" li raggruppa sotto un unico menu "Controllo autoclave" nel
// form di registrazione (vedi TipoManutenzioneField) — lubrificazione
// manipoli e pulizia aspiratori restano invece singole.
export const AUTOCLAVE_PREFIX = "AUTOCLAVE_";

export const TIPI_MANUTENZIONE_DEFAULT = [
  { chiave: "AUTOCLAVE_VACUUM_TEST", nome: "Autoclave — Vacuum test (tenuta del vuoto)", cadenzaGiorni: 1 },
  { chiave: "AUTOCLAVE_HELIX_TEST", nome: "Autoclave — Helix test (Bowie-Dick)", cadenzaGiorni: 1 },
  { chiave: "AUTOCLAVE_INDICATORE_CHIMICO", nome: "Autoclave — Indicatore chimico (ogni ciclo)", cadenzaGiorni: 1 },
  { chiave: "AUTOCLAVE_INDICATORE_BIOLOGICO", nome: "Autoclave — Indicatore biologico (spore test)", cadenzaGiorni: 7 },
  { chiave: "LUBRIFICAZIONE_MANIPOLI", nome: "Lubrificazione manipoli", cadenzaGiorni: 7 },
  { chiave: "PULIZIA_ASPIRATORI", nome: "Pulizia aspiratori", cadenzaGiorni: 30 },
];

export const ESITO_MANUTENZIONE_OPTIONS = [
  { value: "OK", label: "OK / superato" },
  { value: "ANOMALIA", label: "Anomalia riscontrata" },
  { value: "DA_VERIFICARE", label: "Da verificare" },
];

export function optionLabel(options: { value: string; label: string }[], value: string) {
  return options.find((o) => o.value === value)?.label ?? value;
}

/** "Guanti nitrile taglia M" -> "GUANTI_NITRILE_TAGLIA_M": chiave stabile per
 * un nuovo tipo di controllo creato al volo dalla voce "Altro". */
export function slugifyTipo(nome: string): string {
  const slug = nome
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || "ALTRO";
}

export type ManutenzioneRiga = { tipo: string; data: Date; esito: string };
export type TipoManutenzioneInfo = { chiave: string; nome: string; cadenzaGiorni: number | null };

/** Ultima registrazione per ciascun tipo di controllo configurato, e se
 * risulta "in ritardo" rispetto alla cadenza impostata. Un tipo senza
 * cadenza (cadenzaGiorni null) non risulta mai in ritardo. */
export function ultimoControlloPerTipo(righe: ManutenzioneRiga[], tipi: TipoManutenzioneInfo[]) {
  return tipi.map((t) => {
    const delTipo = righe.filter((r) => r.tipo === t.chiave).sort((a, b) => b.data.getTime() - a.data.getTime());
    const ultima = delTipo[0] ?? null;
    const giorni = ultima ? daysUntil(ultima.data) : null;
    const inRitardo = t.cadenzaGiorni !== null && giorni !== null && -giorni > t.cadenzaGiorni;
    return { tipo: t.chiave, label: t.nome, cadenzaGiorni: t.cadenzaGiorni, ultima, inRitardo };
  });
}

export function contaAnomalie(righe: ManutenzioneRiga[]): number {
  return righe.filter((r) => r.esito === "ANOMALIA").length;
}
