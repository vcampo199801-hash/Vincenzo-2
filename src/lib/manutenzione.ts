// Modulo Manutenzione staff: registro dei controlli di routine eseguiti
// dallo staff dello studio (non da un tecnico esterno — per quello vedi
// Registro controlli / ControlloLog): sterilizzazione in autoclave,
// lubrificazione manipoli, pulizia degli aspiratori. Ogni voce riporta
// l'operatore come attestazione di chi l'ha eseguita.
import { daysUntil } from "@/lib/compliance";

export const TIPO_MANUTENZIONE_OPTIONS = [
  { value: "AUTOCLAVE", label: "Controllo autoclave" },
  { value: "LUBRIFICAZIONE_MANIPOLI", label: "Lubrificazione manipoli" },
  { value: "PULIZIA_ASPIRATORI", label: "Pulizia aspiratori" },
  { value: "ALTRO", label: "Altro" },
];

export const ESITO_MANUTENZIONE_OPTIONS = [
  { value: "OK", label: "OK / superato" },
  { value: "ANOMALIA", label: "Anomalia riscontrata" },
  { value: "DA_VERIFICARE", label: "Da verificare" },
];

/** Ogni tipo di controllo dovrebbe ripetersi con questa frequenza massima
 * (in giorni): usato solo per segnalare se un tipo non viene registrato da
 * troppo tempo, non per bloccare nulla. */
export const FREQUENZA_ATTESA_GIORNI: Record<string, number> = {
  AUTOCLAVE: 7,
  LUBRIFICAZIONE_MANIPOLI: 7,
  PULIZIA_ASPIRATORI: 30,
};

export function optionLabel(options: { value: string; label: string }[], value: string) {
  return options.find((o) => o.value === value)?.label ?? value;
}

export type ManutenzioneRiga = { tipo: string; data: Date; esito: string };

/** Ultima registrazione per ciascun tipo di controllo, e se risulta "in ritardo"
 * rispetto alla frequenza attesa. */
export function ultimoControlloPerTipo(righe: ManutenzioneRiga[]) {
  return TIPO_MANUTENZIONE_OPTIONS.filter((t) => t.value !== "ALTRO").map((t) => {
    const delTipo = righe.filter((r) => r.tipo === t.value).sort((a, b) => b.data.getTime() - a.data.getTime());
    const ultima = delTipo[0] ?? null;
    const giorni = ultima ? daysUntil(ultima.data) : null;
    const frequenza = FREQUENZA_ATTESA_GIORNI[t.value];
    const inRitardo = giorni !== null && frequenza !== undefined && -giorni > frequenza;
    return { tipo: t.value, label: t.label, ultima, inRitardo };
  });
}

export function contaAnomalie(righe: ManutenzioneRiga[]): number {
  return righe.filter((r) => r.esito === "ANOMALIA").length;
}
