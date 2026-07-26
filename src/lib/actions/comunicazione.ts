"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireStudio } from "@/lib/auth-guards";
import { isComunicazioneStorageConfigured } from "@/lib/comunicazione";

export type ComunicazioneFormState = { error?: string } | undefined;

async function caricaImmagine(studioId: string, file: FormDataEntryValue | null) {
  if (!(file instanceof File) || file.size === 0) return undefined;
  if (!isComunicazioneStorageConfigured()) {
    throw new Error("L'archiviazione delle immagini non è ancora configurata su questa istanza.");
  }
  const blob = await put(`comunicazione/${studioId}/${Date.now()}-${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });
  return blob.url;
}

export async function creaMateriale(_prev: ComunicazioneFormState, formData: FormData): Promise<ComunicazioneFormState> {
  const { studio } = await requireStudio();

  const titolo = String(formData.get("titolo") ?? "").trim();
  if (!titolo) return { error: "Il titolo è obbligatorio." };

  let immagineUrl: string | undefined;
  try {
    immagineUrl = await caricaImmagine(studio.id, formData.get("immagine"));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Caricamento immagine non riuscito." };
  }

  await prisma.materialeInformativo.create({
    data: {
      studioId: studio.id,
      categoria: String(formData.get("categoria") ?? "ALTRO"),
      titolo,
      descrizione: String(formData.get("descrizione") ?? "").trim() || null,
      videoUrl: String(formData.get("videoUrl") ?? "").trim() || null,
      immagineUrl,
    },
  });

  revalidatePath("/app/comunicazione");
  redirect("/app/comunicazione");
}

export async function aggiornaMateriale(id: string, _prev: ComunicazioneFormState, formData: FormData): Promise<ComunicazioneFormState> {
  const { studio } = await requireStudio();

  const titolo = String(formData.get("titolo") ?? "").trim();
  if (!titolo) return { error: "Il titolo è obbligatorio." };

  const esistente = await prisma.materialeInformativo.findFirst({ where: { id, studioId: studio.id } });
  if (!esistente) return { error: "Materiale non trovato." };

  let immagineUrl: string | undefined;
  try {
    immagineUrl = await caricaImmagine(studio.id, formData.get("immagine"));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Caricamento immagine non riuscito." };
  }
  if (immagineUrl && esistente.immagineUrl) {
    await del(esistente.immagineUrl).catch(() => {});
  }

  await prisma.materialeInformativo.update({
    where: { id },
    data: {
      categoria: String(formData.get("categoria") ?? "ALTRO"),
      titolo,
      descrizione: String(formData.get("descrizione") ?? "").trim() || null,
      videoUrl: String(formData.get("videoUrl") ?? "").trim() || null,
      ...(immagineUrl ? { immagineUrl } : {}),
    },
  });

  revalidatePath("/app/comunicazione");
  revalidatePath(`/app/comunicazione/${id}`);
  redirect(`/app/comunicazione/${id}`);
}

export async function eliminaMateriale(id: string) {
  const { studio } = await requireStudio();
  const record = await prisma.materialeInformativo.findFirst({ where: { id, studioId: studio.id } });
  if (record?.immagineUrl) {
    await del(record.immagineUrl).catch(() => {});
  }
  await prisma.materialeInformativo.deleteMany({ where: { id, studioId: studio.id } });
  revalidatePath("/app/comunicazione");
}
