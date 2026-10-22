"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStudio } from "@/lib/auth-guards";
import { RECAP_SEZIONI } from "@/lib/recap-attivita";

export type RecapDestinatarioFormState = { error?: string; success?: string } | undefined;

/** Legge le checkbox "sezione_<key>" del form: tutte spuntate (o form
 * omesso) → null (nessuna restrizione), stesso pattern di readPermessi in
 * @/lib/actions/team.ts. */
function readSezioni(formData: FormData): string | null {
  const checked = RECAP_SEZIONI.filter((s) => formData.get(`sezione_${s.key}`) === "on").map((s) => s.key);
  if (checked.length === RECAP_SEZIONI.length) return null;
  return JSON.stringify(checked);
}

export async function addRecapDestinatario(_prev: RecapDestinatarioFormState, formData: FormData): Promise<RecapDestinatarioFormState> {
  const { studio } = await requireStudio();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "Inserisci un'email." };

  const sezioni = readSezioni(formData);
  if (sezioni !== null && JSON.parse(sezioni).length === 0) {
    return { error: "Seleziona almeno una sezione del recap per questo destinatario." };
  }

  try {
    await prisma.recapDestinatario.create({ data: { studioId: studio.id, email, sezioni } });
  } catch {
    return { error: `${email} è già tra i destinatari del recap.` };
  }

  revalidatePath("/app/impostazioni");
  return { success: `${email} aggiunto ai destinatari del recap attività.` };
}

export async function updateRecapDestinatarioSezioni(
  destinatarioId: string,
  _prev: RecapDestinatarioFormState,
  formData: FormData
): Promise<RecapDestinatarioFormState> {
  const { studio } = await requireStudio();

  const target = await prisma.recapDestinatario.findFirst({ where: { id: destinatarioId, studioId: studio.id } });
  if (!target) return { error: "Destinatario non trovato." };

  const sezioni = readSezioni(formData);
  if (sezioni !== null && JSON.parse(sezioni).length === 0) {
    return { error: "Seleziona almeno una sezione del recap per questo destinatario." };
  }

  await prisma.recapDestinatario.update({ where: { id: destinatarioId }, data: { sezioni } });
  revalidatePath("/app/impostazioni");
  return { success: "Sezioni aggiornate." };
}

export async function removeRecapDestinatario(destinatarioId: string) {
  const { studio } = await requireStudio();
  await prisma.recapDestinatario.deleteMany({ where: { id: destinatarioId, studioId: studio.id } });
  revalidatePath("/app/impostazioni");
}
