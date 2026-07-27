"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudio } from "@/lib/auth-guards";

function payload(formData: FormData) {
  const dataRaw = String(formData.get("data") ?? "");
  return {
    tipo: String(formData.get("tipo") ?? "ALTRO"),
    data: dataRaw ? new Date(dataRaw) : new Date(),
    operatore: String(formData.get("operatore") ?? "").trim(),
    esito: String(formData.get("esito") ?? "OK"),
    note: String(formData.get("note") ?? "").trim() || null,
  };
}

export async function creaManutenzione(formData: FormData) {
  const { studio } = await requireStudio();
  const data = payload(formData);
  if (!data.operatore) throw new Error("L'operatore è obbligatorio: chi ha eseguito il controllo deve firmarlo.");
  await prisma.manutenzioneLog.create({ data: { studioId: studio.id, ...data } });
  revalidatePath("/app/manutenzione");
  revalidatePath("/app");
  redirect("/app/manutenzione");
}

export async function eliminaManutenzione(id: string) {
  const { studio } = await requireStudio();
  await prisma.manutenzioneLog.deleteMany({ where: { id, studioId: studio.id } });
  revalidatePath("/app/manutenzione");
  revalidatePath("/app");
}
