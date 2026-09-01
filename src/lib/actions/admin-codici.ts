"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";

// Alfabeto senza caratteri facili da confondere a voce o scritti a mano
// (niente 0/O, 1/I/L).
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

// Stesso formato SIR-XXXX-XXXX-XXXX già mostrato come esempio nei form di
// riscatto (RedeemCodeForm, /codice) per i codici venduti su Shopify.
function generaCodice(): string {
  const gruppo = () =>
    Array.from({ length: 4 }, () => ALFABETO[Math.floor(Math.random() * ALFABETO.length)]).join("");
  return `SIR-${gruppo()}-${gruppo()}-${gruppo()}`;
}

export type GeneraCodiceState = { codice: string; giorni: number } | { error: string } | undefined;

/** Codice omaggio generato a mano dall'admin (es. un mese gratis a un
 * dottore) — stesso identico sistema già usato per i codici venduti in
 * blocco su Shopify (AccessCode), solo creato uno alla volta da qui invece
 * che in massa da uno script esterno. A differenza dei codici Shopify
 * (attivazione istantanea, senza carta, perché il cliente ha già pagato lì),
 * questi hanno richiedeCarta=true: il cliente sceglie un piano e inserisce
 * la carta su Stripe Checkout con un periodo di prova gratuito pari ai
 * giorni scelti qui — un cliente già convertito, non solo un accesso
 * gratuito a tempo. Il cliente inizia il riscatto da /codice se non ha
 * ancora un account, o dalla sua pagina Abbonamento se ce l'ha già. */
export async function generaCodiceOmaggio(_prev: GeneraCodiceState, formData: FormData): Promise<GeneraCodiceState> {
  await requireAdmin();

  const giorni = Number(formData.get("giorni") ?? 30);
  if (!Number.isFinite(giorni) || giorni < 1 || giorni > 365) {
    return { error: "Inserisci un numero di giorni valido (tra 1 e 365)." };
  }
  const notaCustom = String(formData.get("nota") ?? "").trim();
  const batchNote = notaCustom ? `Omaggio: ${notaCustom}` : "Omaggio";

  for (let tentativo = 0; tentativo < 5; tentativo++) {
    const codice = generaCodice();
    try {
      await prisma.accessCode.create({ data: { code: codice, days: giorni, batchNote, richiedeCarta: true } });
      revalidatePath("/admin/codici");
      return { codice, giorni };
    } catch {
      // Collisione (praticamente impossibile): riprova con un altro codice.
    }
  }
  return { error: "Impossibile generare un codice univoco, riprova." };
}
