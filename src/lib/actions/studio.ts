"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStudio } from "@/lib/auth-guards";

export async function updateStudioInfo(formData: FormData) {
  const { studio } = await requireStudio();

  await prisma.studio.update({
    where: { id: studio.id },
    data: {
      name: String(formData.get("name") ?? studio.name).trim() || studio.name,
      titolare: String(formData.get("titolare") ?? "").trim() || null,
      citta: String(formData.get("citta") ?? "").trim() || null,
      telefono: String(formData.get("telefono") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
    },
  });

  revalidatePath("/app/impostazioni");
  revalidatePath("/app");
}
