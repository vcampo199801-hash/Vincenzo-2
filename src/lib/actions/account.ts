"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-guards";

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
