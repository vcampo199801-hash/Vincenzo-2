"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { requireStudio } from "@/lib/auth-guards";
import { provisionStudioDefaults } from "@/lib/seed-data";
import type { FormState } from "@/lib/actions/auth";

function normalizeCode(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

async function applyCodeToStudio(codeId: string, studioId: string, days: number) {
  const studio = await prisma.studio.findUnique({ where: { id: studioId }, include: { subscription: true } });
  const now = new Date();
  const base =
    studio?.subscription?.status === "ACTIVE" && studio.subscription.currentPeriodEnd && studio.subscription.currentPeriodEnd > now
      ? studio.subscription.currentPeriodEnd
      : now;
  const currentPeriodEnd = new Date(base);
  currentPeriodEnd.setDate(currentPeriodEnd.getDate() + days);

  await prisma.$transaction(async (tx) => {
    const result = await tx.accessCode.updateMany({
      where: { id: codeId, redeemedAt: null },
      data: { redeemedAt: now, studioId },
    });
    if (result.count !== 1) {
      throw new Error("Questo codice è già stato utilizzato.");
    }
    await tx.subscription.upsert({
      where: { studioId },
      update: { status: "ACTIVE", plan: "shopify-code", currentPeriodEnd, cancelAtPeriodEnd: false },
      create: { studioId, status: "ACTIVE", plan: "shopify-code", currentPeriodEnd },
    });
  });
}

/** Public flow: a visitor with no account redeems a code and creates their studio in one step. */
export async function redeemCodeForNewStudio(_prev: FormState, formData: FormData): Promise<FormState> {
  const code = normalizeCode(String(formData.get("code") ?? ""));
  const nomeStudio = String(formData.get("nomeStudio") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!code || !nomeStudio || !email || !password) {
    return { error: "Compila tutti i campi obbligatori." };
  }
  if (password.length < 8) {
    return { error: "La password deve avere almeno 8 caratteri." };
  }

  const accessCode = await prisma.accessCode.findUnique({ where: { code } });
  if (!accessCode || accessCode.redeemedAt) {
    return { error: "Codice non valido o già utilizzato." };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    // Codice omaggio "con carta": chi possiede il codice può comunque
    // riscattarlo sul proprio account già esistente (es. un'altra prova
    // gratuita per uno studio che ha già finito la prima) — il codice lo
    // diamo noi solo a chi vogliamo, quindi non serve bloccarlo qui; basta
    // verificare la password per essere sicuri che sia davvero lei ad
    // accedere all'account, non un'altra persona che ne conosce l'email.
    if (!accessCode.richiedeCarta) {
      return { error: "Esiste già un account con questa email. Accedi e riscatta il codice dal tuo abbonamento." };
    }
    const validPassword = await bcrypt.compare(password, existingUser.passwordHash);
    if (!validPassword) {
      return { error: "Esiste già un account con questa email: inserisci la password di quell'account per continuare." };
    }
    const membership = await prisma.membership.findFirst({ where: { userId: existingUser.id } });
    if (!membership) {
      return { error: "Esiste già un account con questa email, ma senza uno studio associato. Contattaci per assistenza." };
    }
    await createSession({ userId: existingUser.id, email: existingUser.email, studioId: membership.studioId });
    redirect(`/app/abbonamento?codice=${encodeURIComponent(accessCode.code)}`);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const { user, studio } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: name || null,
        email,
        passwordHash,
        studios: { create: { name: nomeStudio, email } },
      },
      include: { studios: true },
    });
    const studio = user.studios[0];
    await tx.membership.create({ data: { studioId: studio.id, userId: user.id, role: "OWNER" } });
    return { user, studio };
  });

  // Codice omaggio "con carta": non attiva nulla da solo, porta a scegliere
  // un piano e mettere la carta su Stripe Checkout con la prova gratuita —
  // il riscatto vero e proprio (redeemedAt) avviene nel webhook Stripe a
  // pagamento configurato andato a buon fine, non qui.
  if (accessCode.richiedeCarta) {
    await provisionStudioDefaults(studio.id);
    await createSession({ userId: user.id, email: user.email, studioId: studio.id });
    redirect(`/app/abbonamento?codice=${encodeURIComponent(accessCode.code)}`);
  }

  try {
    await applyCodeToStudio(accessCode.id, studio.id, accessCode.days);
  } catch (e) {
    // Roll back the just-created account so a bad/raced code doesn't leave an orphan studio.
    await prisma.user.delete({ where: { id: user.id } });
    return { error: e instanceof Error ? e.message : "Impossibile riscattare il codice." };
  }

  await provisionStudioDefaults(studio.id);
  await createSession({ userId: user.id, email: user.email, studioId: studio.id });
  redirect("/app");
}

/** Logged-in flow: an existing studio redeems a code to activate/extend its subscription. */
export async function redeemCodeForExistingStudio(_prev: FormState, formData: FormData): Promise<FormState> {
  const { studio } = await requireStudio();
  const code = normalizeCode(String(formData.get("code") ?? ""));

  if (!code) return { error: "Inserisci un codice." };

  const accessCode = await prisma.accessCode.findUnique({ where: { code } });
  if (!accessCode || accessCode.redeemedAt) {
    return { error: "Codice non valido o già utilizzato." };
  }

  if (accessCode.richiedeCarta) {
    redirect(`/app/abbonamento?codice=${encodeURIComponent(accessCode.code)}`);
  }

  try {
    await applyCodeToStudio(accessCode.id, studio.id, accessCode.days);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Impossibile riscattare il codice." };
  }

  redirect("/app/abbonamento?redeemed=1");
}
