"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession, requireStudio, isAdminEmail } from "@/lib/auth-guards";
import { RECAP_SEZIONI, parseSezioniRecap, buildRecapAttivita, renderRecapAttivitaHtml } from "@/lib/recap-attivita";
import { isEmailConfigured, sendEmail } from "@/lib/email";

export type ChangePasswordState = { error?: string; success?: string } | undefined;

/** Cambio password del proprio account, disponibile a titolare e collaboratori
 * (non serve essere OWNER: ognuno cambia solo la propria). Prima di questa
 * azione un collaboratore invitato non aveva alcun modo di sostituire la
 * password temporanea ricevuta via email — restava quella per sempre. */
export async function changePassword(_prev: ChangePasswordState, formData: FormData): Promise<ChangePasswordState> {
  const session = await requireSession();

  const passwordAttuale = String(formData.get("passwordAttuale") ?? "");
  const nuovaPassword = String(formData.get("nuovaPassword") ?? "");
  const conferma = String(formData.get("conferma") ?? "");

  if (!passwordAttuale || !nuovaPassword || !conferma) {
    return { error: "Compila tutti i campi." };
  }
  if (nuovaPassword.length < 8) {
    return { error: "La nuova password deve avere almeno 8 caratteri." };
  }
  if (nuovaPassword !== conferma) {
    return { error: "La nuova password e la conferma non coincidono." };
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return { error: "Utente non trovato." };

  const valid = await bcrypt.compare(passwordAttuale, user.passwordHash);
  if (!valid) return { error: "La password attuale non è corretta." };

  const passwordHash = await bcrypt.hash(nuovaPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return { success: "Password aggiornata." };
}

export type NotificationPreferenceState = { error?: string; success?: string } | undefined;

/** Preferenza personale di notifica: ogni membro del team (titolare o
 * collaboratore) può scegliere se ricevere anche lui il promemoria
 * giornaliero di scadenze/farmaci/magazzino, su un'email a sua scelta — non
 * necessariamente quella con cui accede. Indipendente dall'email principale
 * dello studio, impostata separatamente in "Notifiche" qui sopra. */
export async function updateNotificationPreference(
  _prev: NotificationPreferenceState,
  formData: FormData
): Promise<NotificationPreferenceState> {
  const { membership } = await requireStudio();

  const attiva = formData.get("notificheAttive") === "on";
  const email = String(formData.get("notificheEmail") ?? "").trim().toLowerCase();

  if (attiva && !email) {
    return { error: "Inserisci un'email su cui ricevere il promemoria." };
  }

  await prisma.membership.update({
    where: { id: membership.id },
    data: { notificheAttive: attiva, notificheEmail: attiva ? email : null },
  });

  revalidatePath("/app/impostazioni");
  return { success: attiva ? `Riceverai il promemoria delle scadenze su ${email}.` : "Promemoria personale disattivato." };
}

/** Legge le checkbox "sezione_<key>" del form di preferenza del recap
 * attività: tutte spuntate (o form omesso) → null (nessuna restrizione),
 * stesso pattern di readPermessi in @/lib/actions/team.ts. */
function readSezioniRecap(formData: FormData): string | null {
  const checked = RECAP_SEZIONI.filter((s) => formData.get(`sezione_${s.key}`) === "on").map((s) => s.key);
  if (checked.length === RECAP_SEZIONI.length) return null;
  return JSON.stringify(checked);
}

/** Preferenza personale per il recap attività: ogni membro del team lo attiva
 * per sé e sceglie quali sezioni ricevere — a differenza del promemoria
 * scadenze sopra, va sempre alla propria email di accesso, mai a un
 * indirizzo scelto a parte (vedi commento su Membership.recapAttivitaAttivo
 * in schema.prisma). */
export async function updateRecapAttivitaPreference(
  _prev: NotificationPreferenceState,
  formData: FormData
): Promise<NotificationPreferenceState> {
  const { session, membership } = await requireStudio();

  const attiva = formData.get("recapAttivitaAttivo") === "on";
  const sezioni = readSezioniRecap(formData);

  if (attiva && sezioni !== null && JSON.parse(sezioni).length === 0) {
    return { error: "Seleziona almeno una sezione del recap, oppure disattiva il recap." };
  }

  await prisma.membership.update({
    where: { id: membership.id },
    data: { recapAttivitaAttivo: attiva, recapSezioni: attiva ? sezioni : null },
  });

  revalidatePath("/app/impostazioni");
  return { success: attiva ? `Riceverai il recap attività su ${session.email}.` : "Recap attività personale disattivato." };
}

export async function sendTestRecapAttivitaPerMe(): Promise<NotificationPreferenceState> {
  const { session, studio, membership } = await requireStudio();

  if (!isEmailConfigured()) {
    return { error: "Le email non sono ancora configurate su questa istanza (manca RESEND_API_KEY/EMAIL_FROM)." };
  }
  if (!membership.recapAttivitaAttivo) {
    return { error: "Attiva prima il recap attività per te qui sopra." };
  }

  try {
    const recap = await buildRecapAttivita(studio.id);
    if (!recap) {
      return { success: "Nessuna attività registrata oggi: non c'è nulla da segnalare, quindi non è stata inviata alcuna email." };
    }
    const sezioni = parseSezioniRecap(membership.recapSezioni);
    await sendEmail({
      to: session.email,
      subject: `Recap attività di oggi — ${studio.name}`,
      html: renderRecapAttivitaHtml(studio.name, recap, sezioni),
    });
    return { success: `Email di recap inviata a ${session.email}.` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invio non riuscito." };
  }
}

/** Solo per un account admin (vedi ADMIN_EMAILS): attiva l'accesso illimitato
 * al proprio studio, senza prova né carta né dipendenza da Stripe — pensato
 * per l'account personale del titolare della piattaforma, non per i clienti.
 * Agisce sempre e solo sullo studio a cui l'admin è collegato in quel
 * momento, mai su uno studio scelto a piacere. */
export async function attivaAccessoIllimitatoPerMe() {
  const { session, studio } = await requireStudio();
  if (!isAdminEmail(session.email)) redirect("/app");

  const currentPeriodEnd = new Date();
  currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 100);

  await prisma.subscription.upsert({
    where: { studioId: studio.id },
    update: {
      status: "ACTIVE",
      plan: "illimitato",
      currentPeriodEnd,
      cancelAtPeriodEnd: false,
      trialEndsAt: null,
      stripeSubscriptionId: null,
      stripeCustomerId: null,
    },
    create: { studioId: studio.id, status: "ACTIVE", plan: "illimitato", currentPeriodEnd },
  });

  revalidatePath("/app");
  revalidatePath("/app/impostazioni");
  redirect("/app/impostazioni?illimitato=1");
}
