import { Resend } from "resend";

let resendClient: Resend | null = null;

/** Returns null (instead of throwing) when Resend isn't configured yet, so the
 * app keeps working in local/dev without an email provider set up. */
export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resendClient) {
    resendClient = new Resend(key);
  }
  return resendClient;
}

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const resend = getResend();
  const from = process.env.EMAIL_FROM;
  if (!resend || !from) {
    throw new Error("Email non configurata: imposta RESEND_API_KEY e EMAIL_FROM.");
  }
  const { error } = await resend.emails.send({ from, to, subject, html });
  if (error) throw new Error(error.message);
}
