"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireActiveSubscription } from "@/lib/auth-guards";

function payload(formData: FormData) {
  const dataRaw = String(formData.get("data") ?? "");
  return {
    data: dataRaw ? new Date(dataRaw) : new Date(),
    numeroPrimeVisite: Number(formData.get("numeroPrimeVisite") ?? 0) || 0,
    numeroAppuntamenti: Number(formData.get("numeroAppuntamenti") ?? 0) || 0,
    fatturato: Number(formData.get("fatturato") ?? 0) || 0,
    valorePreventiviPresentati: Number(formData.get("valorePreventiviPresentati") ?? 0) || 0,
    valorePreventiviAccettati: Number(formData.get("valorePreventiviAccettati") ?? 0) || 0,
    note: String(formData.get("note") ?? "").trim() || null,
  };
}

/** Un solo giorno per studio (vincolo @@unique): salvare la stessa data aggiorna la riga esistente. */
export async function salvaKpiGiorno(formData: FormData) {
  const { studio } = await requireActiveSubscription("kpi");
  const data = payload(formData);

  await prisma.kpiGiornaliero.upsert({
    where: { studioId_data: { studioId: studio.id, data: data.data } },
    update: data,
    create: { studioId: studio.id, ...data },
  });

  revalidatePath("/app/kpi");
  revalidatePath("/app");
  redirect("/app/kpi");
}

export async function deleteKpiGiorno(id: string) {
  const { studio } = await requireActiveSubscription("kpi");
  await prisma.kpiGiornaliero.deleteMany({ where: { id, studioId: studio.id } });
  revalidatePath("/app/kpi");
  revalidatePath("/app");
}

// ---------- Preventivi ----------

function payloadPreventivo(formData: FormData) {
  const dataRaw = String(formData.get("data") ?? "");
  const scadenzaRaw = String(formData.get("scadenza") ?? "").trim();
  const totaleAccettatoRaw = String(formData.get("totaleAccettato") ?? "").trim();

  return {
    data: dataRaw ? new Date(dataRaw) : new Date(),
    dottore: String(formData.get("dottore") ?? "").trim(),
    commerciale: String(formData.get("commerciale") ?? "").trim() || null,
    totaleProposto: Number(formData.get("totaleProposto") ?? 0) || 0,
    totaleAccettato: totaleAccettatoRaw ? Number(totaleAccettatoRaw) : null,
    scadenza: scadenzaRaw ? new Date(scadenzaRaw) : null,
    assicurazione: formData.get("assicurazione") === "on",
    modalitaPagamento: String(formData.get("modalitaPagamento") ?? "").trim() || null,
    stato: String(formData.get("stato") ?? "PRESENTATO"),
    note: String(formData.get("note") ?? "").trim() || null,
  };
}

export async function createPreventivo(formData: FormData) {
  const { studio } = await requireActiveSubscription("kpi");
  const data = payloadPreventivo(formData);
  if (!data.dottore) throw new Error("Indica il dottore.");

  await prisma.preventivo.create({ data: { studioId: studio.id, ...data } });

  revalidatePath("/app/kpi/preventivi");
  revalidatePath("/app");
  redirect("/app/kpi/preventivi");
}

export async function updatePreventivo(id: string, formData: FormData) {
  const { studio } = await requireActiveSubscription("kpi");
  const data = payloadPreventivo(formData);
  if (!data.dottore) throw new Error("Indica il dottore.");

  await prisma.preventivo.updateMany({ where: { id, studioId: studio.id }, data });

  revalidatePath("/app/kpi/preventivi");
  revalidatePath("/app");
  redirect("/app/kpi/preventivi");
}

export async function deletePreventivo(id: string) {
  const { studio } = await requireActiveSubscription("kpi");
  await prisma.preventivo.deleteMany({ where: { id, studioId: studio.id } });
  revalidatePath("/app/kpi/preventivi");
  revalidatePath("/app");
}
