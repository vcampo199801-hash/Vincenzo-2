import type { ModuleKey } from "@/lib/modules";

export type PianoKey = "BASE" | "PLUS" | "COMPLETO";

// Dashboard non è mai limitata dal piano: è l'accesso di base a cui ogni
// studio con un abbonamento attivo ha diritto.
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
  "forum",
];

// Bilancio, KPI, Spese, Manutenzione e Personale sono i moduli di gestione
// economica dello studio, tutti riservati al piano Plus — è la leva
// principale per convincere a passare dal Base.
const MODULI_PLUS_EXTRA: ModuleKey[] = ["bilancio", "kpi", "spese", "manutenzione", "personale", "comunicazione"];

const MODULI_COMPLETO_EXTRA: ModuleKey[] = ["laboratori"];

export const PIANI: Record<
  PianoKey,
  {
    key: PianoKey;
    label: string;
    prezzoEuro: number;
    stripePriceEnvVar: string;
    moduli: ModuleKey[];
    descrizione: string;
    puntiChiave: string[];
    maxCollaboratori: number;
    consigliato?: boolean;
  }
> = {
  BASE: {
    key: "BASE",
    label: "Base",
    prezzoEuro: 14,
    stripePriceEnvVar: "STRIPE_PRICE_ID_BASE",
    moduli: MODULI_BASE,
    descrizione: "Le funzioni essenziali per iniziare a tenere lo studio in regola.",
    puntiChiave: [
      "Scadenzario, Registro controlli e Report ispezione",
      "Farmaci emergenza, Magazzino e Fornitori",
      "Formazione ECM",
      "1 collaboratore oltre al titolare",
    ],
    maxCollaboratori: 1,
  },
  PLUS: {
    key: "PLUS",
    label: "Plus",
    prezzoEuro: 18,
    stripePriceEnvVar: "STRIPE_PRICE_ID_PLUS",
    moduli: [...MODULI_BASE, ...MODULI_PLUS_EXTRA],
    descrizione: "Il compromesso migliore: tutto il Base più la gestione economica completa dello studio.",
    puntiChiave: [
      "Tutto il piano Base",
      "Bilancio dell'attività e KPI Studio",
      "Gestione Personale, Spese e Manutenzione",
      "Comunicazione Pazienti",
      "3 collaboratori oltre al titolare",
    ],
    maxCollaboratori: 3,
    consigliato: true,
  },
  COMPLETO: {
    key: "COMPLETO",
    label: "Completo",
    prezzoEuro: 23,
    stripePriceEnvVar: "STRIPE_PRICE_ID_COMPLETO",
    moduli: [...MODULI_BASE, ...MODULI_PLUS_EXTRA, ...MODULI_COMPLETO_EXTRA],
    descrizione: "Tutto il Plus, più la gestione dei laboratori esterni e supporto dedicato.",
    puntiChiave: [
      "Tutto il piano Plus",
      "Modulo Laboratori odontotecnici",
      "Supporto dedicato prioritario",
      "5 collaboratori oltre al titolare",
    ],
    maxCollaboratori: 5,
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
