import { sendEmail, isEmailConfigured } from "@/lib/email";
import { daysUntil } from "@/lib/compliance";

const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderTrialHtml(studioName: string, tipo: "promemoria" | "scaduta") {
  const titolo = tipo === "promemoria" ? "La tua prova gratuita scade tra 2 giorni" : "La tua prova gratuita è terminata";
  const corpo =
    tipo === "promemoria"
      ? `<p>Ciao, la prova gratuita di <strong>${escapeHtml(studioName)}</strong> scade tra 2 giorni. Scegli il piano più
         adatto al tuo studio per continuare ad avere scadenze, magazzino e tutto il resto sotto controllo, senza
         interruzioni.</p>`
      : `<p>Ciao, la prova gratuita di 7 giorni di <strong>${escapeHtml(studioName)}</strong> è terminata. Nessun dato è
         andato perso: tutto quello che hai inserito in questi giorni ti aspetta così com'è. Scegli un piano qui sotto
         per sbloccare subito l'accesso.</p>`;

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;max-width:560px;margin:0 auto;">
      <h1 style="font-size:18px;color:#3d7076;">Scadenze in Regola</h1>
      <p style="font-weight:bold;">${titolo}</p>
      ${corpo}
      <p style="margin-top:24px;">
        <a href="${APP_URL()}/app/abbonamento" style="background:#4e888f;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px;">
          Scegli il tuo piano
        </a>
      </p>
      <p style="margin-top:24px;font-size:12px;color:#94a3b8;">
        Dubbi su quale piano scegliere? Scrivici su WhatsApp al
        <a href="https://wa.me/393793899831" style="color:#4e888f;">+39 379 389 9831</a>, ti aiutiamo noi.
      </p>
    </div>
  `;
}

/** Controlla lo stato della prova gratuita di uno studio e invia, al
 * massimo una volta, l'email giusta: un promemoria 2 giorni prima della
 * scadenza, e l'avviso di scadenza il giorno dopo che è effettivamente
 * terminata (mai negli altri giorni, grazie al confronto esatto sui
 * giorni residui — lo stesso approccio della soglia usata nel digest).
 * Indipendente dal flag "notificheAttive" dello studio: quello riguarda i
 * promemoria di scadenza normativa, non lo stato dell'abbonamento. */
export async function sendTrialAlertForStudio(studio: {
  id: string;
  name: string;
  email: string | null;
  subscription: { status: string; trialEndsAt: Date | null } | null;
}): Promise<"promemoria" | "scaduta" | null> {
  if (!isEmailConfigured() || !studio.email) return null;
  const sub = studio.subscription;
  if (!sub || sub.status !== "TRIALING" || !sub.trialEndsAt) return null;

  const giorni = daysUntil(sub.trialEndsAt);
  if (giorni === null) return null;

  if (giorni === 2) {
    await sendEmail({
      to: studio.email,
      subject: `⏳ La tua prova gratuita scade tra 2 giorni — ${studio.name}`,
      html: renderTrialHtml(studio.name, "promemoria"),
    });
    return "promemoria";
  }

  if (giorni === -1) {
    await sendEmail({
      to: studio.email,
      subject: `La tua prova gratuita è terminata — scegli il tuo piano`,
      html: renderTrialHtml(studio.name, "scaduta"),
    });
    return "scaduta";
  }

  return null;
}
