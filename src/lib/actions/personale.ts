"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireStudio } from "@/lib/auth-guards";
import { isCedolinoStorageConfigured } from "@/lib/personale";

function parseDate(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  return str ? new Date(str) : null;
}

function parseFloatOrNull(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  if (!str) return null;
  const n = Number(str);
  return Number.isFinite(n) ? n : null;
}

function dipendentePayload(formData: FormData) {
  return {
    nome: String(formData.get("nome") ?? "").trim(),
    cognome: String(formData.get("cognome") ?? "").trim(),
    mansione: String(formData.get("mansione") ?? "ALTRO"),
    tipoContratto: String(formData.get("tipoContratto") ?? "INDETERMINATO"),
    dataAssunzione: parseDate(formData.get("dataAssunzione")) ?? new Date(),
    dataScadenzaContratto: parseDate(formData.get("dataScadenzaContratto")),
    finePeriodoProva: parseDate(formData.get("finePeriodoProva")),
    oreSettimanali: parseFloatOrNull(formData.get("oreSettimanali")),
    stipendioLordoMensile: parseFloatOrNull(formData.get("stipendioLordoMensile")),
    costoAziendaleMensile: parseFloatOrNull(formData.get("costoAziendaleMensile")),
    stato: String(formData.get("stato") ?? "ATTIVO"),
    note: String(formData.get("note") ?? "").trim() || null,
  };
}

export async function createDipendente(formData: FormData) {
  const { studio } = await requireStudio();
  const dipendente = await prisma.dipendente.create({ data: { studioId: studio.id, ...dipendentePayload(formData) } });
  revalidatePath("/app/personale");
  revalidatePath("/app");
  redirect(`/app/personale/${dipendente.id}`);
}

export async function updateDipendente(id: string, formData: FormData) {
  const { studio } = await requireStudio();
  await prisma.dipendente.updateMany({ where: { id, studioId: studio.id }, data: dipendentePayload(formData) });
  revalidatePath("/app/personale");
  revalidatePath(`/app/personale/${id}`);
  revalidatePath("/app");
  redirect(`/app/personale/${id}`);
}

export async function deleteDipendente(id: string) {
  const { studio } = await requireStudio();
  await prisma.dipendente.deleteMany({ where: { id, studioId: studio.id } });
  revalidatePath("/app/personale");
  revalidatePath("/app");
}

export type UploadCedolinoState = { error?: string } | undefined;

export async function uploadCedolino(dipendenteId: string, _prev: UploadCedolinoState, formData: FormData): Promise<UploadCedolinoState> {
  const { studio } = await requireStudio();

  if (!isCedolinoStorageConfigured()) {
    return { error: "L'archiviazione dei cedolini non è ancora configurata su questa istanza." };
  }

  const mese = Number(formData.get("mese"));
  const anno = Number(formData.get("anno"));
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Seleziona un file PDF da caricare." };
  }
  if (!mese || mese < 1 || mese > 12 || !anno) {
    return { error: "Seleziona mese e anno del cedolino." };
  }

  const blob = await put(`cedolini/${studio.id}/${dipendenteId}/${anno}-${String(mese).padStart(2, "0")}.pdf`, file, {
    access: "public",
    contentType: "application/pdf",
    addRandomSuffix: true,
  });

  await prisma.cedolino.upsert({
    where: { dipendenteId_mese_anno: { dipendenteId, mese, anno } },
    create: { studioId: studio.id, dipendenteId, mese, anno, nomeFile: file.name || "cedolino.pdf", fileUrl: blob.url },
    update: { nomeFile: file.name || "cedolino.pdf", fileUrl: blob.url, dataCaricamento: new Date() },
  });

  revalidatePath(`/app/personale/${dipendenteId}`);
  return undefined;
}

export async function deleteCedolino(id: string, dipendenteId: string) {
  const { studio } = await requireStudio();
  const record = await prisma.cedolino.findFirst({ where: { id, studioId: studio.id } });
  if (record) {
    await del(record.fileUrl).catch(() => {});
    await prisma.cedolino.deleteMany({ where: { id, studioId: studio.id } });
  }
  revalidatePath(`/app/personale/${dipendenteId}`);
}
