"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudio } from "@/lib/auth-guards";

function payload(formData: FormData) {
  const dataRaw = String(formData.get("data") ?? "");
  return {
    data: dataRaw ? new Date(dataRaw) : new Date(),
    categoria: String(formData.get("categoria") ?? "ALTRO"),
    descrizione: String(formData.get("descrizione") ?? "").trim() || null,
    importo: Number(formData.get("importo") ?? 0) || 0,
    ricorrente: formData.get("ricorrente") === "on",
  };
}

export async function creaSpesa(formData: FormData) {
  const { studio } = await requireStudio();
  await prisma.spesaStudio.create({ data: { studioId: studio.id, ...payload(formData) } });
  revalidatePath("/app/spese");
  revalidatePath("/app");
  redirect("/app/spese");
}

export async function aggiornaSpesa(id: string, formData: FormData) {
  const { studio } = await requireStudio();
  await prisma.spesaStudio.updateMany({ where: { id, studioId: studio.id }, data: payload(formData) });
  revalidatePath("/app/spese");
  revalidatePath("/app");
  redirect("/app/spese");
}

export async function eliminaSpesa(id: string) {
  const { studio } = await requireStudio();
  await prisma.spesaStudio.deleteMany({ where: { id, studioId: studio.id } });
  revalidatePath("/app/spese");
  revalidatePath("/app");
}
