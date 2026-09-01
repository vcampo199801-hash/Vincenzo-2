import { sendEmail, isEmailConfigured } from "@/lib/email";
import { daysUntil } from "@/lib/compliance";
import { prisma } from "@/lib/prisma";

const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function emailWrapper(titolo: string, corpo: string, ctaHref: string, ctaLabel: string) {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;max-width:560px;margin:0 auto;">
      <h1 style="font-size:18px;color:#3d7076;">Scadenze in Regola</h1>
      <p style="font-weight:bold;">${titolo}</p>
      ${corpo}
      <p style="margin-top:24px;">
        <a href="${APP_URL()}${ctaHref}" style="background:#4e888f;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px;">
          ${ctaLabel}
        </a>
      </p>
      <p style="margin-top:24px;font-size:12px;color:#94a3b8;">
        Dubbi o domande? Scrivici su WhatsApp al
        <a href="https://wa.me/393793899831" style="color:#4e888f;">+39 379 389 9831</a>, ti aiutiamo noi.
      </p>
    </div>
  `;
}

function renderWelcomeHtml(studioName: string) {
  const corpo = `<p>Ciao, benvenuto su Scadenze in Regola! La prova gratuita di <strong>${escapeHtml(studioName)}</strong> è
    partita: hai 7 giorni per vedere se l'app fa al caso tuo, con tutte le funzionalità sbloccate.</p>
    <p>Due cose semplici da fare subito:</p>
    <ol style="padding-left:20px;">
      <li>Installa l'app sul telefono o sul computer — basta il pulsante "Installa app" in alto, si apre come un'app vera.</li>
      <li>Inserisci la prima scadenza (es. estintore, autoclave) nello Scadenzario: l'app calcola da sola quando scade
        e ti avvisa in anticipo, senza doverci pensare tu.</li>
    </ol>`;
  return emailWrapper("Benvenuto! La tua prova gratuita è iniziata", corpo, "/app", "Apri l'app");
}

function renderNurtureHtml(studioName: string) {
  const corpo = `<p>Ciao, la prova gratuita di <strong>${escapeHtml(studioName)}</strong> è a metà strada. Oltre alle
    scadenze, hai già dato un'occhiata al Bilancio? Confronta da solo il fatturato con tutti i costi dello studio —
    spese, personale, laboratori, manutenzioni — e ti dice subito se sei in utile o in perdita, per anno, mese o un
    periodo a tua scelta. Niente più fogli Excel o attese per il commercialista.</p>`;
  return emailWrapper("💡 Un consiglio a metà prova", corpo, "/app/bilancio", "Guarda il Bilancio");
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
  return emailWrapper(titolo, corpo, "/app/abbonamento", "Scegli il tuo piano");
}

/** Email di benvenuto, mandata una sola volta subito dopo la registrazione
 * (chiamata da signupAction, non dal cron): a differenza di promemoria e
 * scaduta non ha bisogno di essere "recuperabile", perché scatta in un
 * punto preciso e già noto del codice, non da un controllo giornaliero. Non
 * deve mai far fallire la registrazione, quindi va sempre chiamata dentro
 * un try/catch dal chiamante. */
export async function sendWelcomeEmail(studio: { id: string; name: string; email: string }) {
  if (!isEmailConfigured()) return;
  await sendEmail({
    to: studio.email,
    subject: `Benvenuto su Scadenze in Regola, ${studio.name}!`,
    html: renderWelcomeHtml(studio.name),
  });
  await prisma.subscription.update({
    where: { studioId: studio.id },
    data: { benvenutoInviatoAt: new Date() },
  });
}

/** Controlla lo stato della prova gratuita di uno studio e invia, al
 * massimo una volta ciascuna, le email del suo ciclo di vita: un consiglio
 * a metà prova (giorno 3-4), un promemoria entro gli ultimi 2 giorni, e
 * l'avviso di scadenza una volta che è effettivamente terminata. Usa i
 * campi *InviataAt (non più un confronto sul giorno esatto) apposta per
 * essere "recuperabile": se un giorno viene saltato per qualsiasi motivo
 * (es. l'email dello studio non era ancora impostata, un intoppo del cron),
 * la prossima esecuzione manda comunque l'email invece di perdere quella
 * finestra per sempre. Indipendente dal flag "notificheAttive" dello
 * studio: quello riguarda i promemoria di scadenza normativa, non lo stato
 * dell'abbonamento. */
export async function sendTrialAlertForStudio(studio: {
  id: string;
  name: string;
  email: string | null;
  subscription: {
    status: string;
    trialEndsAt: Date | null;
    stripeSubscriptionId: string | null;
    nurtureTrialInviataAt: Date | null;
    promemoriaTrialInviatoAt: Date | null;
    scadenzaTrialInviataAt: Date | null;
  } | null;
}): Promise<"nurture" | "promemoria" | "scaduta" | null> {
  if (!isEmailConfigured() || !studio.email) return null;
  const sub = studio.subscription;
  if (!sub || sub.status !== "TRIALING" || !sub.trialEndsAt) return null;
  // Prova gestita da Stripe (codice omaggio "con carta", vedi /admin/codici):
  // ha già un piano e un metodo di pagamento, l'addebito parte da solo a
  // fine prova. Le email di "scegli un piano"/"scaduta" sono pensate per chi
  // deve ancora decidere, quindi non hanno senso qui e confonderebbero.
  if (sub.stripeSubscriptionId) return null;

  const giorni = daysUntil(sub.trialEndsAt);
  if (giorni === null) return null;

  if (giorni >= 3 && giorni <= 4 && !sub.nurtureTrialInviataAt) {
    await sendEmail({
      to: studio.email,
      subject: `💡 Un consiglio per Scadenze in Regola — ${studio.name}`,
      html: renderNurtureHtml(studio.name),
    });
    await prisma.subscription.update({
      where: { studioId: studio.id },
      data: { nurtureTrialInviataAt: new Date() },
    });
    return "nurture";
  }

  if (giorni >= 0 && giorni <= 2 && !sub.promemoriaTrialInviatoAt) {
    await sendEmail({
      to: studio.email,
      subject: `⏳ La tua prova gratuita scade tra 2 giorni — ${studio.name}`,
      html: renderTrialHtml(studio.name, "promemoria"),
    });
    await prisma.subscription.update({
      where: { studioId: studio.id },
      data: { promemoriaTrialInviatoAt: new Date() },
    });
    return "promemoria";
  }

  if (giorni < 0 && !sub.scadenzaTrialInviataAt) {
    await sendEmail({
      to: studio.email,
      subject: `La tua prova gratuita è terminata — scegli il tuo piano`,
      html: renderTrialHtml(studio.name, "scaduta"),
    });
    await prisma.subscription.update({
      where: { studioId: studio.id },
      data: { scadenzaTrialInviataAt: new Date() },
    });
    return "scaduta";
  }

  return null;
}
