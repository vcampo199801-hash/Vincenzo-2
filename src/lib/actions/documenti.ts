"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireStudio, requireActiveSubscription } from "@/lib/auth-guards";
import { isDocumentiStorageConfigured } from "@/lib/documenti";

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

export type UploadDocumentoFileState = { error?: string } | undefined;

/** Un solo file per riga: un nuovo caricamento sovrascrive il precedente
 * (sia su Blob che sul record), a differenza dei Cedolini dove ogni mese è
 * un file a sé. */
export async function uploadDocumentoFile(id: string, _prev: UploadDocumentoFileState, formData: FormData): Promise<UploadDocumentoFileState> {
  const { studio } = await requireActiveSubscription("documenti");

  if (!isDocumentiStorageConfigured()) {
    return { error: "L'archiviazione dei documenti non è ancora configurata su questa istanza." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Seleziona un file da caricare." };
  }

  const esistente = await prisma.documento.findFirst({ where: { id, studioId: studio.id } });
  if (!esistente) return { error: "Documento non trovato." };

  const blob = await put(`documenti/${studio.id}/${id}/${Date.now()}-${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  if (esistente.fileUrl) await del(esistente.fileUrl).catch(() => {});

  await prisma.documento.update({
    where: { id },
    data: { nomeFile: file.name || "documento", fileUrl: blob.url, dataCaricamento: new Date() },
  });

  revalidatePath("/app/documenti");
  revalidatePath(`/app/documenti/${id}/edit`);
  return undefined;
}

export async function deleteDocumentoFile(id: string) {
  const { studio } = await requireActiveSubscription("documenti");
  const record = await prisma.documento.findFirst({ where: { id, studioId: studio.id } });
  if (record?.fileUrl) {
    await del(record.fileUrl).catch(() => {});
    await prisma.documento.update({ where: { id }, data: { nomeFile: null, fileUrl: null, dataCaricamento: null } });
  }
  revalidatePath("/app/documenti");
  revalidatePath(`/app/documenti/${id}/edit`);
}
