import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { sendWelcomeEmail } from "@/lib/trial-alerts";
import { notificaTitolare } from "@/lib/owner-alerts";

export const dynamic = "force-dynamic";

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/** Secondo passo del signup: l'utente arriva qui cliccando il link ricevuto
 * via email. Solo da qui in poi l'account diventa davvero utilizzabile —
 * prima di questo momento esiste nel database ma non può accedere (vedi
 * loginAction) e la Direzione non viene ancora avvisata della nuova prova,
 * cosi un'email falsa/usa-e-getta non genera mai un account funzionante né
 * una notifica inutile. */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(`${appUrl()}/login?errore=token-mancante`);
  }

  const user = await prisma.user.findUnique({
    where: { tokenVerificaEmail: token },
    include: { studios: { include: { subscription: true } } },
  });

  if (!user || !user.tokenVerificaScadenza || user.tokenVerificaScadenza < new Date()) {
    return NextResponse.redirect(`${appUrl()}/login?errore=link-scaduto`);
  }

  // Già confermato in passato (es. link cliccato due volte): non rifare il
  // lavoro, basta far accedere.
  if (!user.emailVerificataAt) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerificataAt: new Date(), tokenVerificaEmail: null, tokenVerificaScadenza: null },
    });
  }

  const studio = user.studios[0];
  if (!studio) {
    return NextResponse.redirect(`${appUrl()}/login?errore=studio-mancante`);
  }
  const membership = await prisma.membership.findFirst({ where: { studioId: studio.id, userId: user.id } });
  if (!membership) {
    return NextResponse.redirect(`${appUrl()}/login?errore=studio-mancante`);
  }

  await createSession({ userId: user.id, email: user.email, studioId: studio.id });

  try {
    await sendWelcomeEmail({ id: studio.id, name: studio.name, email: user.email });
  } catch (err) {
    console.error("Email di benvenuto fallita:", err);
  }

  await notificaTitolare(
    "🆕 Nuova prova gratuita — Scadenze in Regola",
    `<p>Nuovo studio registrato (email confermata): <strong>${studio.name}</strong></p>
     <p>Email: ${user.email}</p>
     <p>Prova gratuita fino al ${studio.subscription?.trialEndsAt?.toLocaleDateString("it-IT") ?? "—"}.</p>`,
  );

  // Stesso meccanismo di tracciamento già usato dal signup diretto (vedi
  // signup-conversion-tracker.tsx): generato qui perché solo ora la
  // registrazione è davvero completa.
  const registrationEventId = randomUUID();
  const trialEventId = randomUUID();
  return NextResponse.redirect(`${appUrl()}/app?signup=1&reg_eid=${registrationEventId}&trial_eid=${trialEventId}`);
}
