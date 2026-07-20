"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudio } from "@/lib/auth-guards";

function parseDate(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  return str ? new Date(str) : null;
}

function payload(formData: FormData) {
  return {
    adempimentoId: String(formData.get("adempimentoId") ?? "").trim() || null,
    dataIntervento: parseDate(formData.get("dataIntervento")) ?? new Date(),
    tecnico: String(formData.get("tecnico") ?? "").trim() || null,
    esito: String(formData.get("esito") ?? "Conforme"),
    costo: Number(formData.get("costo") ?? 0) || 0,
    note: String(formData.get("note") ?? "").trim() || null,
  };
}

export async function createControllo(formData: FormData) {
  const { studio } = await requireStudio();
  await prisma.controlloLog.create({ data: { studioId: studio.id, ...payload(formData) } });
  revalidatePath("/app/controlli");
  revalidatePath("/app");
  redirect("/app/controlli");
}

export async function updateControllo(id: string, formData: FormData) {
  const { studio } = await requireStudio();
  await prisma.controlloLog.updateMany({ where: { id, studioId: studio.id }, data: payload(formData) });
  revalidatePath("/app/controlli");
  revalidatePath("/app");
  redirect("/app/controlli");
}

export async function deleteControllo(id: string) {
  const { studio } = await requireStudio();
  await prisma.controlloLog.deleteMany({ where: { id, studioId: studio.id } });
  revalidatePath("/app/controlli");
  revalidatePath("/app");
}
