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
    categoria: String(formData.get("categoria") ?? "Altro"),
    prodotto: String(formData.get("prodotto") ?? "").trim(),
    fornitore: String(formData.get("fornitore") ?? "").trim() || null,
    unita: String(formData.get("unita") ?? "pz"),
    scortaMinima: Number(formData.get("scortaMinima") ?? 0) || 0,
    quantitaAttuale: Number(formData.get("quantitaAttuale") ?? 0) || 0,
    scadenzaLotto: parseDate(formData.get("scadenzaLotto")),
    prezzoUnitario: Number(formData.get("prezzoUnitario") ?? 0) || 0,
    codice: String(formData.get("codice") ?? "").trim() || null,
    note: String(formData.get("note") ?? "").trim() || null,
    notificaSilenziata: formData.get("notificaSilenziata") === "on",
  };
}

export async function createMagazzinoItem(formData: FormData) {
  const { studio } = await requireStudio();
  await prisma.magazzinoItem.create({ data: { studioId: studio.id, ...payload(formData) } });
  revalidatePath("/app/magazzino");
  revalidatePath("/app");
  redirect("/app/magazzino");
}

export async function updateMagazzinoItem(id: string, formData: FormData) {
  const { studio } = await requireStudio();
  await prisma.magazzinoItem.updateMany({ where: { id, studioId: studio.id }, data: payload(formData) });
  revalidatePath("/app/magazzino");
  revalidatePath("/app");
  redirect("/app/magazzino");
}

export async function deleteMagazzinoItem(id: string) {
  const { studio } = await requireStudio();
  await prisma.magazzinoItem.deleteMany({ where: { id, studioId: studio.id } });
  revalidatePath("/app/magazzino");
  revalidatePath("/app");
}

/** Regola rapidamente la quantità attuale dall'elenco, senza aprire la scheda
 * dell'articolo (frecce +/- nella tabella). Non scende mai sotto zero. */
export async function regolaQuantita(id: string, delta: number) {
  const { studio } = await requireStudio();
  const item = await prisma.magazzinoItem.findFirst({ where: { id, studioId: studio.id } });
  if (!item) return;
  await prisma.magazzinoItem.update({
    where: { id },
    data: { quantitaAttuale: Math.max(0, item.quantitaAttuale + delta) },
  });
  revalidatePath("/app/magazzino");
  revalidatePath("/app");
}
