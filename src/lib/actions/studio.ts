"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStudio } from "@/lib/auth-guards";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { isSmsConfigured, sendSms, normalizePhoneForSms } from "@/lib/sms";
import { buildDigestForStudio, renderDigestHtml, renderDigestText } from "@/lib/notifications";

export async function updateStudioInfo(formData: FormData) {
  const { studio } = await requireStudio();

  const telefonoSmsRaw = String(formData.get("telefonoSms") ?? "").trim();

  await prisma.studio.update({
    where: { id: studio.id },
    data: {
      name: String(formData.get("name") ?? studio.name).trim() || studio.name,
      titolare: String(formData.get("titolare") ?? "").trim() || null,
      citta: String(formData.get("citta") ?? "").trim() || null,
      telefono: String(formData.get("telefono") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      notificheAttive: formData.get("notificheAttive") === "on",
      notificheSms: formData.get("notificheSms") === "on",
      telefonoSms: normalizePhoneForSms(telefonoSmsRaw),
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
    const digest = await buildDigestForStudio(studio.id);
    if (!digest) {
      return { success: "Nessuna scadenza urgente al momento: non c'è nulla da segnalare, quindi non è stata inviata alcuna email." };
    }
    const totalCount = digest.scadenzeUrgenti.length + digest.farmaciUrgenti.length + digest.lottiUrgenti.length;
    await sendEmail({
      to: studio.email,
      subject: `${totalCount} ${totalCount === 1 ? "cosa richiede" : "cose richiedono"} attenzione — ${studio.name}`,
      html: renderDigestHtml(studio.name, digest),
    });
    return { success: `Email di riepilogo inviata a ${studio.email}.` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invio non riuscito." };
  }
}

export async function sendTestSms(): Promise<TestDigestState> {
  const { studio } = await requireStudio();

  if (!isSmsConfigured()) {
    return { error: "Gli SMS non sono ancora configurati su questa istanza (manca TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_FROM_NUMBER)." };
  }
  if (!studio.telefonoSms) {
    return { error: "Imposta prima un cellulare per gli SMS qui sopra." };
  }

  try {
    const digest = await buildDigestForStudio(studio.id);
    if (!digest) {
      return { success: "Nessuna scadenza urgente al momento: non c'è nulla da segnalare, quindi non è stato inviato alcun SMS." };
    }
    await sendSms({ to: studio.telefonoSms, body: renderDigestText(studio.name, digest) });
    return { success: `SMS di riepilogo inviato a ${studio.telefonoSms}.` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invio non riuscito." };
  }
}
