"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudio } from "@/lib/auth-guards";

function payload(formData: FormData) {
  return {
    professionista: String(formData.get("professionista") ?? "").trim(),
    crediti2026: Number(formData.get("crediti2026") ?? 0) || 0,
    crediti2027: Number(formData.get("crediti2027") ?? 0) || 0,
    crediti2028: Number(formData.get("crediti2028") ?? 0) || 0,
    target: Number(formData.get("target") ?? 150) || 150,
  };
}

export async function createEcm(formData: FormData) {
  const { studio } = await requireStudio();
  await prisma.ecmCredito.create({ data: { studioId: studio.id, ...payload(formData) } });
  revalidatePath("/app/ecm");
  revalidatePath("/app");
  redirect("/app/ecm");
}

export async function updateEcm(id: string, formData: FormData) {
  const { studio } = await requireStudio();
  await prisma.ecmCredito.updateMany({ where: { id, studioId: studio.id }, data: payload(formData) });
  revalidatePath("/app/ecm");
  revalidatePath("/app");
  redirect("/app/ecm");
}

export async function deleteEcm(id: string) {
  const { studio } = await requireStudio();
  await prisma.ecmCredito.deleteMany({ where: { id, studioId: studio.id } });
  revalidatePath("/app/ecm");
  revalidatePath("/app");
}
