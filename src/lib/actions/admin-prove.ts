"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { sendTrialAlertForStudio } from "@/lib/trial-alerts";

export type ControllaOraState = { esito: "nurture" | "promemoria" | "scaduta" | null } | { error: string } | undefined;

/** Forza subito il controllo che normalmente fa il cron una volta al
 * giorno, per un singolo studio: utile per non dover aspettare fino alle
 * 9:00 del giorno dopo quando serve sapere/mandare adesso. Manda al
 * massimo un'email (quella dovuta in base ai giorni rimasti), le stesse
 * regole e gli stessi campi *InviataAt del cron. */
export async function controllaEInviaOra(_prev: ControllaOraState, formData: FormData): Promise<ControllaOraState> {
  await requireAdmin();

  const studioId = String(formData.get("studioId") ?? "").trim();
  if (!studioId) return { error: "Studio non specificato." };

  const studio = await prisma.studio.findUnique({
    where: { id: studioId },
    include: { subscription: true },
  });
  if (!studio) return { error: "Studio non trovato." };

  const esito = await sendTrialAlertForStudio(studio);
  revalidatePath("/admin/prove");
  return { esito };
}
