import { sendEmail, isEmailConfigured } from "@/lib/email";

const OWNER_EMAIL = "v.campo199801@gmail.com";

/** Avvisa il titolare via email sugli eventi importanti dell'attività (nuova
 * prova gratuita, primo pagamento, annullamento, pagamento non riuscito).
 * Non deve mai interrompere il flusso principale (signup, webhook Stripe):
 * un eventuale errore di invio viene solo loggato. */
export async function notificaTitolare(subject: string, html: string) {
  if (!isEmailConfigured()) return;
  try {
    await sendEmail({ to: OWNER_EMAIL, subject, html });
  } catch (err) {
    console.error("Notifica titolare non inviata:", err);
  }
}
