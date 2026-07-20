"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStudio } from "@/lib/auth-guards";
import { isEmailConfigured } from "@/lib/email";
import { sendDigestForStudio } from "@/lib/notifications";

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
      notificheAttive: formData.get("notificheAttive") === "on",
    },
  });

  revalidatePath("/app/impostazioni");
  revalidatePath("/app");
}

export type TestDigestState = { error?: string; success?: string } | undefined;

export async function sendTestDigest(): Promise<TestDigestState> {
  const { studio } = await requireStudio();

  if (!isEmailConfigured()) {
    return { error: "Le email non sono ancora configurate su questa istanza (manca RESEND_API_KEY/EMAIL_FROM)." };
  }
  if (!studio.email) {
    return { error: "Imposta prima un'email dello studio qui sopra." };
  }

  try {
    const sent = await sendDigestForStudio(studio);
    return sent
      ? { success: `Email di riepilogo inviata a ${studio.email}.` }
      : { success: "Nessuna scadenza urgente al momento: non c'è nulla da segnalare, quindi non è stata inviata alcuna email." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invio non riuscito." };
  }
}
