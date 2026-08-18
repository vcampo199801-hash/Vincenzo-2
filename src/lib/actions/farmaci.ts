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
    nome: String(formData.get("nome") ?? "").trim(),
    categoriaUso: String(formData.get("categoriaUso") ?? "").trim() || null,
    doveSiTrova: String(formData.get("doveSiTrova") ?? "").trim() || null,
    quantita: Number(formData.get("quantita") ?? 1) || 1,
    lotto: String(formData.get("lotto") ?? "").trim() || null,
    scadenza: parseDate(formData.get("scadenza")),
    codice: String(formData.get("codice") ?? "").trim() || null,
    note: String(formData.get("note") ?? "").trim() || null,
    notificaSilenziata: formData.get("notificaSilenziata") === "on",
  };
}

export async function createFarmaco(formData: FormData) {
  const { studio } = await requireStudio();
  await prisma.farmaco.create({ data: { studioId: studio.id, ...payload(formData) } });
  revalidatePath("/app/farmaci");
  revalidatePath("/app");
  redirect("/app/farmaci");
}

export async function updateFarmaco(id: string, formData: FormData) {
  const { studio } = await requireStudio();
  await prisma.farmaco.updateMany({ where: { id, studioId: studio.id }, data: payload(formData) });
  revalidatePath("/app/farmaci");
  revalidatePath("/app");
  redirect("/app/farmaci");
}

export async function deleteFarmaco(id: string) {
  const { studio } = await requireStudio();
  await prisma.farmaco.deleteMany({ where: { id, studioId: studio.id } });
  revalidatePath("/app/farmaci");
  revalidatePath("/app");
}

/** Come cercaArticoloPerCodice del magazzino: trova un farmaco/presidio già
 * censito con lo stesso codice a barre per precompilare i campi descrittivi
 * alla scansione di un riordino. Quantità, lotto e scadenza restano quelli
 * appena letti (o da inserire a mano). */
export async function cercaFarmacoPerCodice(codice: string) {
  const { studio } = await requireStudio();
  const trimmed = codice.trim();
  if (!trimmed) return null;
  const farmaco = await prisma.farmaco.findFirst({ where: { studioId: studio.id, codice: trimmed } });
  if (!farmaco) return null;
  return {
    nome: farmaco.nome,
    categoriaUso: farmaco.categoriaUso ?? "",
    doveSiTrova: farmaco.doveSiTrova ?? "",
  };
}

export async function updateControlloMensile(
  id: string,
  data: { dataControllo: string; operatore: string; fatto: boolean; note: string }
) {
  const { studio } = await requireStudio();
  await prisma.farmacoControlloMensile.updateMany({
    where: { id, studioId: studio.id },
    data: {
      dataControllo: data.dataControllo ? new Date(data.dataControllo) : null,
      operatore: data.operatore.trim() || null,
      fatto: data.fatto,
      note: data.note.trim() || null,
    },
  });
  revalidatePath("/app/farmaci");
}

export async function ensureControlliAnno(anno: number) {
  const { studio } = await requireStudio();
  const existing = await prisma.farmacoControlloMensile.findMany({ where: { studioId: studio.id, anno } });
  const existingMesi = new Set(existing.map((e) => e.mese));
  const missing = Array.from({ length: 12 }, (_, i) => i + 1).filter((m) => !existingMesi.has(m));
  if (missing.length > 0) {
    await prisma.farmacoControlloMensile.createMany({
      data: missing.map((mese) => ({ studioId: studio.id, anno, mese })),
    });
  }
}
