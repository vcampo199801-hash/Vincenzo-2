"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireStudio, requireActiveSubscription } from "@/lib/auth-guards";

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

export type ConfirmDocumentoFileState = { error?: string } | undefined;

/** Il file è già su Blob a questo punto (caricato dal browser direttamente,
 * vedi DocumentoUploadForm + /api/documenti/upload): qui si salva solo il
 * risultato sul record, dopo aver riverificato che il documento appartenga
 * davvero a questo studio. Un solo file per riga — un nuovo caricamento
 * sovrascrive il precedente, a differenza dei Cedolini dove ogni mese è un
 * file a sé. */
export async function confirmDocumentoFile(id: string, fileUrl: string, nomeFile: string): Promise<ConfirmDocumentoFileState> {
  const { studio } = await requireActiveSubscription("documenti");

  const esistente = await prisma.documento.findFirst({ where: { id, studioId: studio.id } });
  if (!esistente) return { error: "Documento non trovato." };

  if (esistente.fileUrl && esistente.fileUrl !== fileUrl) await del(esistente.fileUrl).catch(() => {});

  await prisma.documento.update({
    where: { id },
    data: { nomeFile: nomeFile || "documento", fileUrl, dataCaricamento: new Date() },
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
