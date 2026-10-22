"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStudio } from "@/lib/auth-guards";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { buildDigestForStudio, renderDigestHtml } from "@/lib/notifications";
import { buildRecapAttivita, renderRecapAttivitaHtml, parseSezioniRecap } from "@/lib/recap-attivita";

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
      indirizzo: String(formData.get("indirizzo") ?? "").trim() || null,
      numeroAlboTitolare: String(formData.get("numeroAlboTitolare") ?? "").trim() || null,
      partitaIva: String(formData.get("partitaIva") ?? "").trim() || null,
      codiceFiscale: String(formData.get("codiceFiscale") ?? "").trim() || null,
      pec: String(formData.get("pec") ?? "").trim() || null,
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
    const digest = await buildDigestForStudio(studio.id);
    if (!digest) {
      return { success: "Nessuna scadenza urgente al momento: non c'è nulla da segnalare, quindi non è stata inviata alcuna email." };
    }
    const totalCount =
      digest.scadenzeUrgenti.length +
      digest.farmaciUrgenti.length +
      digest.lottiUrgenti.length +
      digest.scorteBasseUrgenti.length +
      digest.manutenzioniUrgenti.length +
      digest.forumUrgenti.length;
    await sendEmail({
      to: studio.email,
      subject: `${totalCount} ${totalCount === 1 ? "cosa richiede" : "cose richiedono"} attenzione — ${studio.name}`,
      html: await renderDigestHtml(studio.name, digest),
    });
    return { success: `Email di riepilogo inviata a ${studio.email}.` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invio non riuscito." };
  }
}

export async function sendTestRecapAttivita(): Promise<TestDigestState> {
  const { studio } = await requireStudio();

  if (!isEmailConfigured()) {
    return { error: "Le email non sono ancora configurate su questa istanza (manca RESEND_API_KEY/EMAIL_FROM)." };
  }
  const destinatari = await prisma.recapDestinatario.findMany({ where: { studioId: studio.id } });
  if (destinatari.length === 0) {
    return { error: "Aggiungi prima almeno un destinatario del recap attività qui sotto." };
  }

  try {
    const recap = await buildRecapAttivita(studio.id);
    if (!recap) {
      return { success: "Nessuna attività registrata oggi: non c'è nulla da segnalare, quindi non è stata inviata alcuna email." };
    }
    const inviati: string[] = [];
    for (const d of destinatari) {
      const sezioni = parseSezioniRecap(d.sezioni);
      await sendEmail({
        to: d.email,
        subject: `Recap attività di oggi — ${studio.name}`,
        html: renderRecapAttivitaHtml(studio.name, recap, sezioni),
      });
      inviati.push(d.email);
    }
    return { success: `Email di recap inviata a: ${inviati.join(", ")}.` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invio non riuscito." };
  }
}
