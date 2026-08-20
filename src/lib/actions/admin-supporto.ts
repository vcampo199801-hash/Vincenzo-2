"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";

export async function segnaRichiestaRisolta(id: string, risolta: boolean) {
  await requireAdmin();
  await prisma.richiestaSupporto.update({ where: { id }, data: { risolta } });
  revalidatePath("/admin/supporto");
}
