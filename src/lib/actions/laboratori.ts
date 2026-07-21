"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireStudio } from "@/lib/auth-guards";
import { serializeTipologie, isLaboratoriStorageConfigured, CATEGORIA_DICHIARAZIONE_CONFORMITA } from "@/lib/laboratori";

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

// ---------- Laboratorio ----------

function laboratorioPayload(formData: FormData) {
  const tipologie = formData.getAll("tipologia").map(String);
  return {
    ragioneSociale: String(formData.get("ragioneSociale") ?? "").trim(),
    partitaIva: String(formData.get("partitaIva") ?? "").trim() || null,
    indirizzo: String(formData.get("indirizzo") ?? "").trim() || null,
    referente: String(formData.get("referente") ?? "").trim() || null,
    telefono: String(formData.get("telefono") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    numeroRegistrazioneMinisteriale: String(formData.get("numeroRegistrazioneMinisteriale") ?? "").trim() || null,
    dataUltimaVerificaRegistrazione: parseDate(formData.get("dataUltimaVerificaRegistrazione")),
    tipologieLavorazione: serializeTipologie(tipologie),
    stato: String(formData.get("stato") ?? "ATTIVO"),
    note: String(formData.get("note") ?? "").trim() || null,
  };
}

export async function createLaboratorio(formData: FormData) {
  const { studio } = await requireStudio();
  const laboratorio = await prisma.laboratorio.create({ data: { studioId: studio.id, ...laboratorioPayload(formData) } });
  revalidatePath("/app/laboratori");
  redirect(`/app/laboratori/${laboratorio.id}`);
}

export async function updateLaboratorio(id: string, formData: FormData) {
  const { studio } = await requireStudio();
  await prisma.laboratorio.updateMany({ where: { id, studioId: studio.id }, data: laboratorioPayload(formData) });
  revalidatePath("/app/laboratori");
  revalidatePath(`/app/laboratori/${id}`);
  redirect(`/app/laboratori/${id}`);
}

export async function deleteLaboratorio(id: string) {
  const { studio } = await requireStudio();
  const allegati = await prisma.allegatoLaboratorio.findMany({ where: { laboratorioId: id, studioId: studio.id } });
  await Promise.all(allegati.map((a) => del(a.fileUrl).catch(() => {})));
  await prisma.laboratorio.deleteMany({ where: { id, studioId: studio.id } });
  revalidatePath("/app/laboratori");
}

export type UploadState = { error?: string } | undefined;

export async function uploadDocumentoLaboratorio(laboratorioId: string, _prev: UploadState, formData: FormData): Promise<UploadState> {
  const { studio } = await requireStudio();
  if (!isLaboratoriStorageConfigured()) {
    return { error: "L'archiviazione dei documenti non è ancora configurata su questa istanza." };
  }
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Seleziona un file da caricare." };
  }
  const categoria = String(formData.get("categoria") ?? "ALTRO");

  const blob = await put(`laboratori/${studio.id}/${laboratorioId}/${Date.now()}-${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  await prisma.allegatoLaboratorio.create({
    data: { studioId: studio.id, laboratorioId, categoria, nomeFile: file.name || "documento", fileUrl: blob.url },
  });

  revalidatePath(`/app/laboratori/${laboratorioId}`);
  return undefined;
}

export async function deleteDocumentoLaboratorio(id: string, laboratorioId: string) {
  const { studio } = await requireStudio();
  const record = await prisma.allegatoLaboratorio.findFirst({ where: { id, studioId: studio.id } });
  if (record) {
    await del(record.fileUrl).catch(() => {});
    await prisma.allegatoLaboratorio.deleteMany({ where: { id, studioId: studio.id } });
  }
  revalidatePath(`/app/laboratori/${laboratorioId}`);
}

// ---------- Lavorazione ----------

function lavorazionePayload(formData: FormData) {
  return {
    laboratorioId: String(formData.get("laboratorioId") ?? ""),
    riferimentoPaziente: String(formData.get("riferimentoPaziente") ?? "").trim(),
    tipoLavorazione: String(formData.get("tipoLavorazione") ?? "ALTRO"),
    elementiDentali: String(formData.get("elementiDentali") ?? "").trim() || null,
    dataInvio: parseDate(formData.get("dataInvio")) ?? new Date(),
    dataConsegnaPrevista: parseDate(formData.get("dataConsegnaPrevista")),
    stato: String(formData.get("stato") ?? "INVIATO"),
    costo: parseFloatOrNull(formData.get("costo")),
    note: String(formData.get("note") ?? "").trim() || null,
  };
}

export async function createLavorazione(formData: FormData) {
  const { studio } = await requireStudio();
  const { laboratorioId, ...rest } = lavorazionePayload(formData);
  const lavorazione = await prisma.lavorazione.create({ data: { studioId: studio.id, laboratorioId, ...rest } });
  revalidatePath("/app/laboratori/lavorazioni");
  revalidatePath("/app");
  redirect(`/app/laboratori/lavorazioni/${lavorazione.id}`);
}

export async function updateLavorazione(id: string, formData: FormData) {
  const { studio } = await requireStudio();
  await prisma.lavorazione.updateMany({ where: { id, studioId: studio.id }, data: lavorazionePayload(formData) });
  revalidatePath("/app/laboratori/lavorazioni");
  revalidatePath(`/app/laboratori/lavorazioni/${id}`);
  revalidatePath("/app");
  redirect(`/app/laboratori/lavorazioni/${id}`);
}

export async function deleteLavorazione(id: string) {
  const { studio } = await requireStudio();
  const allegati = await prisma.allegatoLaboratorio.findMany({ where: { lavorazioneId: id, studioId: studio.id } });
  await Promise.all(allegati.map((a) => del(a.fileUrl).catch(() => {})));
  await prisma.lavorazione.deleteMany({ where: { id, studioId: studio.id } });
  revalidatePath("/app/laboratori/lavorazioni");
  revalidatePath("/app");
}

// Campi modificabili tramite l'editing inline del Registro lavorazioni.
const CAMPI_INLINE = new Set(["stato", "dataConsegnaPrevista", "dataConsegnaEffettiva", "costo", "dataConsegnaCopiaPaziente"]);

export async function updateCampoLavorazione(id: string, campo: string, valore: string) {
  const { studio } = await requireStudio();
  if (!CAMPI_INLINE.has(campo)) throw new Error("Campo non modificabile da qui.");

  const data: Record<string, unknown> =
    campo === "costo"
      ? { costo: valore.trim() ? Number(valore) : null }
      : campo === "stato"
        ? { stato: valore }
        : { [campo]: valore.trim() ? new Date(valore) : null };

  await prisma.lavorazione.updateMany({ where: { id, studioId: studio.id }, data });
  revalidatePath("/app/laboratori/lavorazioni");
  revalidatePath("/app/laboratori");
  revalidatePath("/app");
}

export async function uploadDichiarazioneConformita(lavorazioneId: string, _prev: UploadState, formData: FormData): Promise<UploadState> {
  const { studio } = await requireStudio();
  if (!isLaboratoriStorageConfigured()) {
    return { error: "L'archiviazione dei documenti non è ancora configurata su questa istanza." };
  }
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Seleziona il file della dichiarazione di conformità." };
  }

  const esistente = await prisma.allegatoLaboratorio.findFirst({
    where: { lavorazioneId, studioId: studio.id, categoria: CATEGORIA_DICHIARAZIONE_CONFORMITA },
  });
  if (esistente) {
    await del(esistente.fileUrl).catch(() => {});
    await prisma.allegatoLaboratorio.delete({ where: { id: esistente.id } });
  }

  const blob = await put(`laboratori/${studio.id}/lavorazioni/${lavorazioneId}/${Date.now()}-${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  await prisma.allegatoLaboratorio.create({
    data: {
      studioId: studio.id,
      lavorazioneId,
      categoria: CATEGORIA_DICHIARAZIONE_CONFORMITA,
      nomeFile: file.name || "dichiarazione-conformita.pdf",
      fileUrl: blob.url,
    },
  });

  revalidatePath(`/app/laboratori/lavorazioni/${lavorazioneId}`);
  revalidatePath("/app/laboratori/lavorazioni");
  revalidatePath("/app/laboratori");
  revalidatePath("/app");
  return undefined;
}

export async function uploadAllegatoLavorazione(lavorazioneId: string, _prev: UploadState, formData: FormData): Promise<UploadState> {
  const { studio } = await requireStudio();
  if (!isLaboratoriStorageConfigured()) {
    return { error: "L'archiviazione dei documenti non è ancora configurata su questa istanza." };
  }
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Seleziona un file da caricare." };
  }
  const categoria = String(formData.get("categoria") ?? "ALTRO");

  const blob = await put(`laboratori/${studio.id}/lavorazioni/${lavorazioneId}/${Date.now()}-${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  await prisma.allegatoLaboratorio.create({
    data: { studioId: studio.id, lavorazioneId, categoria, nomeFile: file.name || "allegato", fileUrl: blob.url },
  });

  revalidatePath(`/app/laboratori/lavorazioni/${lavorazioneId}`);
  return undefined;
}

export async function deleteAllegatoLavorazione(id: string, lavorazioneId: string) {
  const { studio } = await requireStudio();
  const record = await prisma.allegatoLaboratorio.findFirst({ where: { id, studioId: studio.id } });
  if (record) {
    await del(record.fileUrl).catch(() => {});
    await prisma.allegatoLaboratorio.deleteMany({ where: { id, studioId: studio.id } });
  }
  revalidatePath(`/app/laboratori/lavorazioni/${lavorazioneId}`);
  revalidatePath("/app/laboratori/lavorazioni");
  revalidatePath("/app/laboratori");
  revalidatePath("/app");
}
