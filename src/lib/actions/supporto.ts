"use server";

import { prisma } from "@/lib/prisma";
import { requireStudio } from "@/lib/auth-guards";
import { isEmailConfigured, sendEmail } from "@/lib/email";

export type SupportoState = { error?: string; success?: string } | undefined;

export async function inviaRichiestaSupporto(_prev: SupportoState, formData: FormData): Promise<SupportoState> {
  const { session, studio } = await requireStudio();

  const messaggio = String(formData.get("messaggio") ?? "").trim();
  if (!messaggio) {
    return { error: "Scrivi un messaggio prima di inviare." };
  }

  await prisma.richiestaSupporto.create({
    data: { studioId: studio.id, daEmail: session.email, messaggio },
  });

  const adminEmail = (process.env.ADMIN_EMAILS ?? "").split(",")[0]?.trim();
  if (adminEmail && isEmailConfigured()) {
    await sendEmail({
      to: adminEmail,
      subject: `Richiesta di supporto — ${studio.name}`,
      html: `<p><strong>${studio.name}</strong> (${session.email}) ha scritto:</p><p>${messaggio.replace(/\n/g, "<br>")}</p>`,
    }).catch(() => {});
  }

  return { success: "Messaggio inviato: ti risponderemo via email il prima possibile." };
}
