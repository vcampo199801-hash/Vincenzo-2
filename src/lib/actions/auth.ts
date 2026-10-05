"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/session";
import { provisionStudioDefaults } from "@/lib/seed-data";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { trialDays } from "@/lib/trial";
import { nuovoTokenVerifica, renderVerificaEmailHtml } from "@/lib/email-verification";

export type FormState = { error?: string; emailDaVerificare?: string } | undefined;

async function inviaEmailVerifica(nomeStudio: string, email: string, token: string) {
  if (!isEmailConfigured()) return;
  await sendEmail({
    to: email,
    subject: "Conferma la tua email — Scadenze in Regola",
    html: renderVerificaEmailHtml(nomeStudio, token),
  });
}

export async function signupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const nomeStudio = String(formData.get("nomeStudio") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!nomeStudio || !email || !password) {
    return { error: "Compila tutti i campi obbligatori." };
  }
  if (password.length < 8) {
    return { error: "La password deve avere almeno 8 caratteri." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Si era registrato ma non aveva mai confermato l'email (es. l'aveva
    // persa, o aveva usato un indirizzo che non controlla spesso): invece di
    // bloccarlo con un errore permanente, gli rimandiamo un nuovo link sullo
    // stesso account già creato, senza ricrearne uno nuovo.
    if (!existing.emailVerificataAt) {
      const { token, scadenza } = nuovoTokenVerifica();
      await prisma.user.update({
        where: { id: existing.id },
        data: { tokenVerificaEmail: token, tokenVerificaScadenza: scadenza },
      });
      await inviaEmailVerifica(nomeStudio, email, token);
      redirect(`/verifica-email-inviata?email=${encodeURIComponent(email)}`);
    }
    return { error: "Esiste già un account con questa email." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + trialDays());

  const { token, scadenza } = nuovoTokenVerifica();

  const { studio } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: name || null,
        email,
        passwordHash,
        tokenVerificaEmail: token,
        tokenVerificaScadenza: scadenza,
        studios: {
          create: {
            name: nomeStudio,
            email,
            subscription: {
              create: {
                status: "TRIALING",
                trialEndsAt,
              },
            },
          },
        },
      },
      include: { studios: true },
    });
    const studio = user.studios[0];
    await tx.membership.create({
      data: { studioId: studio.id, userId: user.id, role: "OWNER", notificheAttive: true, notificheEmail: email },
    });
    return { user, studio };
  });

  // Dati di base già pronti (scadenzario standard, ecc.) non appena conferma
  // l'email — niente attesa aggiuntiva al primo accesso.
  await provisionStudioDefaults(studio.id);

  // Niente sessione, niente email di benvenuto, niente avviso alla
  // Direzione: tutto questo scatta solo dopo la conferma (vedi
  // /api/verifica-email), cosi un indirizzo falso/usa-e-getta non diventa
  // mai un account utilizzabile né genera notifiche inutili.
  try {
    await inviaEmailVerifica(nomeStudio, email, token);
  } catch (err) {
    console.error("Email di verifica fallita:", err);
  }

  redirect(`/verifica-email-inviata?email=${encodeURIComponent(email)}`);
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: "Credenziali non valide." };

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return { error: "Credenziali non valide." };

  if (!user.emailVerificataAt) {
    return {
      error: "Devi prima confermare la tua email: controlla la posta (anche lo spam) e clicca il link ricevuto.",
      emailDaVerificare: email,
    };
  }

  const membership = await prisma.membership.findFirst({ where: { userId: user.id } });
  if (!membership) return { error: "Nessuno studio associato a questo account." };

  await createSession({ userId: user.id, email: user.email, studioId: membership.studioId });
  redirect("/app");
}

export type ResendState = { error?: string; success?: string } | undefined;

/** Richiamata dal piccolo form "Rinvia email" nella pagina di login, per chi
 * ha perso la prima email di conferma o il link è scaduto. Risponde sempre
 * con lo stesso messaggio generico, indipendentemente dal fatto che
 * l'account esista o sia già verificato, per non rivelare quali email sono
 * registrate. */
export async function resendVerificationEmail(_prev: ResendState, formData: FormData): Promise<ResendState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const messaggioGenerico = { success: "Se l'indirizzo risulta registrato e da confermare, ti abbiamo inviato una nuova email." };
  if (!email) return { error: "Inserisci un'email." };

  const user = await prisma.user.findUnique({ where: { email }, include: { studios: true } });
  if (!user || user.emailVerificataAt) return messaggioGenerico;

  const { token, scadenza } = nuovoTokenVerifica();
  await prisma.user.update({ where: { id: user.id }, data: { tokenVerificaEmail: token, tokenVerificaScadenza: scadenza } });
  try {
    await inviaEmailVerifica(user.studios[0]?.name ?? "il tuo studio", email, token);
  } catch (err) {
    console.error("Reinvio email di verifica fallito:", err);
  }
  return messaggioGenerico;
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
