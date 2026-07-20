"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudio } from "@/lib/auth-guards";

function payload(formData: FormData) {
  return {
    nome: String(formData.get("nome") ?? "").trim(),
    stato: String(formData.get("stato") ?? "MANCANTE"),
    note: String(formData.get("note") ?? "").trim() || null,
  };
}

export async function createDocumento(formData: FormData) {
  const { studio } = await requireStudio();
  await prisma.documento.create({ data: { studioId: studio.id, ...payload(formData) } });
  revalidatePath("/app/documenti");
  revalidatePath("/app");
  redirect("/app/documenti");
}

export async function updateDocumento(id: string, formData: FormData) {
  const { studio } = await requireStudio();
  await prisma.documento.updateMany({ where: { id, studioId: studio.id }, data: payload(formData) });
  revalidatePath("/app/documenti");
  revalidatePath("/app");
  redirect("/app/documenti");
}

export async function setDocumentoStato(id: string, stato: string) {
  const { studio } = await requireStudio();
  await prisma.documento.updateMany({ where: { id, studioId: studio.id }, data: { stato } });
  revalidatePath("/app/documenti");
  revalidatePath("/app");
}

export async function deleteDocumento(id: string) {
  const { studio } = await requireStudio();
  await prisma.documento.deleteMany({ where: { id, studioId: studio.id } });
  revalidatePath("/app/documenti");
  revalidatePath("/app");
}
