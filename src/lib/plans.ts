import type { ModuleKey } from "@/lib/modules";

export type PianoKey = "BASE" | "PLUS" | "COMPLETO";

// Dashboard e Abbonamento non sono mai limitati dal piano: sono l'accesso di base
// a cui ogni studio con un abbonamento attivo ha diritto.
const MODULI_BASE: ModuleKey[] = [
  "dashboard",
  "scadenzario",
  "controlli",
  "ecm",
  "documenti",
  "magazzino",
  "farmaci",
  "fornitori",
  "report",
];

export const PIANI: Record<
  PianoKey,
  {
    key: PianoKey;
    label: string;
    prezzoEuro: number;
    stripePriceEnvVar: string;
    moduli: ModuleKey[];
    descrizione: string;
  }
> = {
  BASE: {
    key: "BASE",
    label: "Base",
    prezzoEuro: 14,
    stripePriceEnvVar: "STRIPE_PRICE_ID_BASE",
    moduli: MODULI_BASE,
    descrizione:
      "Gli otto moduli di compliance essenziali: scadenzario, registro controlli, formazione ECM, documenti, magazzino, farmaci emergenza, fornitori e report ispezione.",
  },
  PLUS: {
    key: "PLUS",
    label: "Plus",
    prezzoEuro: 18,
    stripePriceEnvVar: "STRIPE_PRICE_ID_PLUS",
    moduli: [...MODULI_BASE, "personale"],
    descrizione: "Tutto il piano Base, più l'anagrafica del personale e l'archivio cedolini.",
  },
  COMPLETO: {
    key: "COMPLETO",
    label: "Completo",
    prezzoEuro: 23,
    stripePriceEnvVar: "STRIPE_PRICE_ID_COMPLETO",
    moduli: [...MODULI_BASE, "personale", "laboratori"],
    descrizione:
      "Tutto il piano Plus, più la gestione dei laboratori odontotecnici e la conformità dei dispositivi su misura.",
  },
};

export const PIANI_ORDINE: PianoKey[] = ["BASE", "PLUS", "COMPLETO"];

export function isPianoKey(value: string | null | undefined): value is PianoKey {
  return value === "BASE" || value === "PLUS" || value === "COMPLETO";
}

/** Qualsiasi valore non riconosciuto (es. "standard", "shopify-code" dei vecchi abbonamenti)
 * viene considerato Completo: non si toglie l'accesso a chi lo aveva già prima dei piani. */
export function normalizzaPiano(value: string | null | undefined): PianoKey {
  return isPianoKey(value) ? value : "COMPLETO";
}

export function pianoConsenteModulo(planValue: string | null | undefined, moduleKey: ModuleKey): boolean {
  return PIANI[normalizzaPiano(planValue)].moduli.includes(moduleKey);
}

/** Il piano più economico che include un dato modulo, per suggerire l'upgrade giusto. */
export function pianoMinimoPerModulo(moduleKey: ModuleKey): PianoKey | undefined {
  return PIANI_ORDINE.find((key) => PIANI[key].moduli.includes(moduleKey));
}

export function stripePriceIdPerPiano(piano: PianoKey): string | undefined {
  return process.env[PIANI[piano].stripePriceEnvVar];
}
