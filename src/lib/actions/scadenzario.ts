"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudio } from "@/lib/auth-guards";

function parseDate(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  return str ? new Date(str) : null;
}

export async function createAdempimento(formData: FormData) {
  const { studio } = await requireStudio();

  await prisma.adempimento.create({
    data: {
      studioId: studio.id,
      nome: String(formData.get("nome") ?? "").trim(),
      riferimento: String(formData.get("riferimento") ?? "").trim() || null,
      periodicita: String(formData.get("periodicita") ?? "Annuale"),
      mesi: Number(formData.get("mesi") ?? 12),
      dataUltimoControllo: parseDate(formData.get("dataUltimoControllo")),
      note: String(formData.get("note") ?? "").trim() || null,
    },
  });

  revalidatePath("/app/scadenzario");
  revalidatePath("/app");
  redirect("/app/scadenzario");
}

export async function updateAdempimento(id: string, formData: FormData) {
  const { studio } = await requireStudio();

  await prisma.adempimento.updateMany({
    where: { id, studioId: studio.id },
    data: {
      nome: String(formData.get("nome") ?? "").trim(),
      riferimento: String(formData.get("riferimento") ?? "").trim() || null,
      periodicita: String(formData.get("periodicita") ?? "Annuale"),
      mesi: Number(formData.get("mesi") ?? 12),
      dataUltimoControllo: parseDate(formData.get("dataUltimoControllo")),
      note: String(formData.get("note") ?? "").trim() || null,
    },
  });

  revalidatePath("/app/scadenzario");
  revalidatePath("/app");
  redirect("/app/scadenzario");
}

export async function deleteAdempimento(id: string) {
  const { studio } = await requireStudio();
  await prisma.adempimento.deleteMany({ where: { id, studioId: studio.id } });
  revalidatePath("/app/scadenzario");
  revalidatePath("/app");
}
