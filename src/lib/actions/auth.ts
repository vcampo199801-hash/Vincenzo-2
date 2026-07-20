"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/session";
import { provisionStudioDefaults } from "@/lib/seed-data";

export type FormState = { error?: string } | undefined;

function trialDays() {
  const raw = Number(process.env.TRIAL_DAYS ?? "14");
  return Number.isFinite(raw) && raw > 0 ? raw : 14;
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
    return { error: "Esiste già un account con questa email." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + trialDays());

  const user = await prisma.user.create({
    data: {
      name: name || null,
      email,
      passwordHash,
      studios: {
        create: {
          name: nomeStudio,
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
  await provisionStudioDefaults(studio.id);
  await createSession({ userId: user.id, email: user.email, studioId: studio.id });
  redirect("/app");
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({
    where: { email },
    include: { studios: true },
  });
  if (!user) return { error: "Credenziali non valide." };

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return { error: "Credenziali non valide." };

  const studio = user.studios[0];
  if (!studio) return { error: "Nessuno studio associato a questo account." };

  await createSession({ userId: user.id, email: user.email, studioId: studio.id });
  redirect("/app");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
