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
    tipo: String(formData.get("tipo") ?? "COMPLIANCE"),
    ruolo: String(formData.get("ruolo") ?? "").trim(),
    nome: String(formData.get("nome") ?? "").trim() || null,
    telefono: String(formData.get("telefono") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    contrattoAttivo: formData.get("contrattoAttivo") === "on",
    scadenzaContratto: parseDate(formData.get("scadenzaContratto")),
    note: String(formData.get("note") ?? "").trim() || null,
  };
}

export async function createFornitore(formData: FormData) {
  const { studio } = await requireStudio();
  await prisma.fornitore.create({ data: { studioId: studio.id, ...payload(formData) } });
  revalidatePath("/app/fornitori");
  redirect("/app/fornitori");
}

export async function updateFornitore(id: string, formData: FormData) {
  const { studio } = await requireStudio();
  await prisma.fornitore.updateMany({ where: { id, studioId: studio.id }, data: payload(formData) });
  revalidatePath("/app/fornitori");
  redirect("/app/fornitori");
}

export async function deleteFornitore(id: string) {
  const { studio } = await requireStudio();
  await prisma.fornitore.deleteMany({ where: { id, studioId: studio.id } });
  revalidatePath("/app/fornitori");
}
