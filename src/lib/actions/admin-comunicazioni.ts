"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { getResend, isEmailConfigured } from "@/lib/email";

export type ComunicazioneState = { success: true; sent: number; failed: number } | { error: string } | undefined;

export type Destinatari = "tutti" | "attivi" | "prova" | "scaduti" | "singolo";

const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderComunicazioneHtml(oggetto: string, messaggio: string) {
  const paragrafi = messaggio
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("");

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;max-width:560px;margin:0 auto;">
      <h1 style="font-size:18px;color:#3d7076;">Scadenze in Regola</h1>
      <p style="font-weight:bold;">${escapeHtml(oggetto)}</p>
      ${paragrafi}
      <p style="margin-top:24px;">
        <a href="${APP_URL()}/app" style="background:#4e888f;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px;">
          Apri l'app
        </a>
      </p>
      <p style="margin-top:24px;font-size:12px;color:#94a3b8;">
        Domande? Scrivici su WhatsApp al
        <a href="https://wa.me/393793899831" style="color:#4e888f;">+39 379 389 9831</a>.
      </p>
    </div>
  `;
}

function whereDestinatari(destinatari: Destinatari, studioId?: string) {
  if (destinatari === "singolo") return { id: studioId ?? "__nessuno__", email: { not: null } };
  if (destinatari === "attivi") return { email: { not: null }, subscription: { status: "ACTIVE" } };
  if (destinatari === "prova") return { email: { not: null }, subscription: { status: "TRIALING" } };
  // Stesso "Scadute, non ancora convertite" di /admin/prove: prova già finita
  // (trialEndsAt nel passato) ma senza aver ancora scelto un piano — se si
  // abbonano, Stripe li sposta da solo fuori da questo status.
  if (destinatari === "scaduti") {
    return { email: { not: null }, subscription: { status: "TRIALING", trialEndsAt: { lt: new Date() } } };
  }
  return { email: { not: null } };
}

const DIMENSIONE_LOTTO = 100; // limite per richiesta dell'API batch di Resend

/** Invio manuale, una tantum, a scopo di annuncio (non una scadenza o un
 * avviso di sistema): l'admin scrive oggetto e testo e lo manda a tutti gli
 * studi registrati, o a un sottoinsieme per stato abbonamento. Usa l'invio
 * batch di Resend (fino a 100 email per chiamata) invece di un ciclo con un
 * invio alla volta: con più di una manciata di destinatari, un ciclo con una
 * pausa tra un invio e l'altro rischiava di far scadere il tempo massimo
 * concesso alla richiesta prima di arrivare in fondo alla lista. */
export async function inviaComunicazione(_prev: ComunicazioneState, formData: FormData): Promise<ComunicazioneState> {
  await requireAdmin();

  const oggetto = String(formData.get("oggetto") ?? "").trim();
  const messaggio = String(formData.get("messaggio") ?? "").trim();
  const destinatari = (String(formData.get("destinatari") ?? "tutti") as Destinatari) ?? "tutti";
  const studioId = String(formData.get("studioId") ?? "").trim() || undefined;

  if (!oggetto || !messaggio) {
    return { error: "Compila oggetto e messaggio." };
  }
  if (destinatari === "singolo" && !studioId) {
    return { error: "Seleziona lo studio a cui mandarla." };
  }
  const resend = getResend();
  const from = process.env.EMAIL_FROM;
  if (!isEmailConfigured() || !resend || !from) {
    return { error: "Email non configurata: imposta RESEND_API_KEY e EMAIL_FROM." };
  }

  const studi = await prisma.studio.findMany({
    where: whereDestinatari(destinatari, studioId),
    select: { id: true, email: true },
  });
  const destinatariValidi = studi.filter((s): s is { id: string; email: string } => Boolean(s.email));

  const html = renderComunicazioneHtml(oggetto, messaggio);
  let sent = 0;
  let failed = 0;
  const righeInviate: { studioId: string; email: string; resendId: string }[] = [];

  for (let i = 0; i < destinatariValidi.length; i += DIMENSIONE_LOTTO) {
    const lotto = destinatariValidi.slice(i, i + DIMENSIONE_LOTTO);
    try {
      const { data, error } = await resend.batch.send(
        lotto.map((s) => ({ from, to: s.email, subject: oggetto, html })),
      );
      if (error || !data) throw new Error(error?.message ?? "Resend non ha risposto con i dati attesi.");
      lotto.forEach((s, idx) => {
        const resendId = data.data[idx]?.id;
        if (resendId) righeInviate.push({ studioId: s.id, email: s.email, resendId });
      });
      sent += lotto.length;
    } catch (err) {
      failed += lotto.length;
      console.error(`Comunicazione: lotto di ${lotto.length} email fallito:`, err);
    }
  }

  // Storico: serve per il resoconto in pagina e, se in Resend è attivo
  // l'open tracking con un webhook collegato a /api/webhooks/resend, anche
  // per sapere quante di queste email sono state aperte (vedi apertaAt su
  // ComunicazioneInvio, valorizzato dal webhook, mai da qui).
  await prisma.comunicazione.create({
    data: {
      oggetto,
      messaggio,
      destinatari,
      totale: destinatariValidi.length,
      inviate: sent,
      fallite: failed,
      invii: { create: righeInviate },
    },
  });

  revalidatePath("/admin/comunicazioni");
  return { success: true, sent, failed };
}

/** Corregge gli studi creati prima che la registrazione salvasse in automatico
 * l'email dello studio (vedi signupAction): finché non viene impostata a mano
 * da Impostazioni, quello studio non riceve nessuna delle email automatiche
 * (promemoria/scadenza prova, digest, comunicazioni) perché tutte filtrano su
 * questo campo. Riempie il vuoto con l'email del titolare (owner), l'unica
 * che di sicuro esiste fin dalla registrazione. Non tocca gli studi che
 * hanno già un'email impostata, quindi si può rilanciare senza rischi. */
export type CorreggiEmailState = { corretti: number; senzaProprietario: number } | undefined;

export async function correggiEmailStudiMancanti(
  _prev: CorreggiEmailState,
  _formData: FormData,
): Promise<CorreggiEmailState> {
  await requireAdmin();

  const studiSenzaEmail = await prisma.studio.findMany({
    where: { email: null },
    include: { owner: true },
  });

  let corretti = 0;
  let senzaProprietario = 0;
  for (const studio of studiSenzaEmail) {
    if (!studio.owner.email) {
      senzaProprietario++;
      continue;
    }
    await prisma.studio.update({ where: { id: studio.id }, data: { email: studio.owner.email } });
    corretti++;
  }

  revalidatePath("/admin/comunicazioni");
  return { corretti, senzaProprietario };
}
