import { randomUUID } from "node:crypto";

const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Validità del link di conferma: abbastanza ampia da non far scadere il
// link prima che qualcuno controlli la posta, ma non infinita.
const ORE_VALIDITA_TOKEN = 48;

export function nuovoTokenVerifica() {
  return {
    token: randomUUID(),
    scadenza: new Date(Date.now() + ORE_VALIDITA_TOKEN * 60 * 60 * 1000),
  };
}

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function renderVerificaEmailHtml(nomeStudio: string, token: string) {
  const link = `${APP_URL()}/api/verifica-email?token=${encodeURIComponent(token)}`;
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;max-width:560px;margin:0 auto;">
      <h1 style="font-size:18px;color:#3d7076;">Scadenze in Regola</h1>
      <p>Ciao, un'ultima cosa prima di iniziare la prova gratuita di <strong>${escapeHtml(nomeStudio)}</strong>:
      conferma questo indirizzo email cliccando il pulsante qui sotto.</p>
      <p style="margin-top:24px;">
        <a href="${link}" style="background:#4e888f;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px;">
          Conferma la tua email
        </a>
      </p>
      <p style="margin-top:24px;font-size:12px;color:#94a3b8;">
        Il link resta valido per ${ORE_VALIDITA_TOKEN} ore. Se non sei stato tu a registrarti, ignora pure questa email:
        senza conferma l'account resta semplicemente inattivo, non potrai accedere.
      </p>
    </div>
  `;
}
