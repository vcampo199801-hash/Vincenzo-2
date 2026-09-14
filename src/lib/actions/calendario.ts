"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStudio } from "@/lib/auth-guards";

/** Crea (o sostituisce) il token segreto del feed calendario dello studio.
 * Rigenerarlo invalida il link precedente: serve se è stato condiviso per
 * sbaglio o se si vuole staccare un calendario già collegato altrove. */
export async function generaLinkCalendario() {
  const { studio } = await requireStudio();

  const token = randomBytes(24).toString("hex");
  await prisma.studio.update({ where: { id: studio.id }, data: { calendarioToken: token } });

  revalidatePath("/app/laboratori/scadenze");
  revalidatePath("/app/scadenzario");
}
