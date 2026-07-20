"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudio } from "@/lib/auth-guards";

function parseDate(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  return str ? new Date(str) : null;
}

export async function createAdempimento(formData: FormData) {
  const { studio } = await requireStudio();

  await prisma.adempimento.create({
    data: {
      studioId: studio.id,
      nome: String(formData.get("nome") ?? "").trim(),
      riferimento: String(formData.get("riferimento") ?? "").trim() || null,
      periodicita: String(formData.get("periodicita") ?? "Annuale"),
      mesi: Number(formData.get("mesi") ?? 12),
      dataUltimoControllo: parseDate(formData.get("dataUltimoControllo")),
      note: String(formData.get("note") ?? "").trim() || null,
    },
  });

  revalidatePath("/app/scadenzario");
  revalidatePath("/app");
  redirect("/app/scadenzario");
}

export async function updateAdempimento(id: string, formData: FormData) {
  const { studio } = await requireStudio();

  await prisma.adempimento.updateMany({
    where: { id, studioId: studio.id },
    data: {
      nome: String(formData.get("nome") ?? "").trim(),
      riferimento: String(formData.get("riferimento") ?? "").trim() || null,
      periodicita: String(formData.get("periodicita") ?? "Annuale"),
      mesi: Number(formData.get("mesi") ?? 12),
      dataUltimoControllo: parseDate(formData.get("dataUltimoControllo")),
      note: String(formData.get("note") ?? "").trim() || null,
    },
  });

  revalidatePath("/app/scadenzario");
  revalidatePath("/app");
  redirect("/app/scadenzario");
}

export async function deleteAdempimento(id: string) {
  const { studio } = await requireStudio();
  await prisma.adempimento.deleteMany({ where: { id, studioId: studio.id } });
  revalidatePath("/app/scadenzario");
  revalidatePath("/app");
}

/**
 * One-click "segna eseguito": updates the deadline's last-check date and logs
 * the intervention in the Registro Controlli in a single action, so compiling
 * a deadline never requires visiting two different modules.
 */
export async function markAdempimentoDone(
  id: string,
  data: { data: string; tecnico: string; costo: string; esito: string; note: string }
) {
  const { studio } = await requireStudio();
  const dataIntervento = data.data ? new Date(data.data) : new Date();
  const costo = Number(data.costo) || 0;
  const tecnico = data.tecnico.trim() || null;
  const esito = data.esito.trim() || "Conforme";
  const note = data.note.trim() || null;

  const adempimento = await prisma.adempimento.findFirst({ where: { id, studioId: studio.id } });
  if (!adempimento) return;

  await prisma.$transaction([
    prisma.adempimento.update({ where: { id }, data: { dataUltimoControllo: dataIntervento } }),
    prisma.controlloLog.create({
      data: { studioId: studio.id, adempimentoId: id, dataIntervento, tecnico, esito, costo, note },
    }),
  ]);

  revalidatePath("/app/scadenzario");
  revalidatePath("/app/controlli");
  revalidatePath("/app");
}
