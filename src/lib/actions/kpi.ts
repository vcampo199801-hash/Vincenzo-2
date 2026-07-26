"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudio } from "@/lib/auth-guards";

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
  const { studio } = await requireStudio();
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
  const { studio } = await requireStudio();
  await prisma.kpiGiornaliero.deleteMany({ where: { id, studioId: studio.id } });
  revalidatePath("/app/kpi");
  revalidatePath("/app");
}
