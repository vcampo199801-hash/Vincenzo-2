"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireStudio } from "@/lib/auth-guards";

export type TeamFormState = { error?: string; success?: string } | undefined;

const TEMP_PASSWORD_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function generateTempPassword(length = 10) {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += TEMP_PASSWORD_ALPHABET[Math.floor(Math.random() * TEMP_PASSWORD_ALPHABET.length)];
  }
  return out;
}

async function requireOwner() {
  const { session, studio, membership } = await requireStudio();
  return { session, studio, isOwner: membership.role === "OWNER" };
}

export async function inviteMember(_prev: TeamFormState, formData: FormData): Promise<TeamFormState> {
  const { studio, isOwner } = await requireOwner();
  if (!isOwner) return { error: "Solo il titolare dello studio può invitare collaboratori." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  if (!email) return { error: "Inserisci un'email." };

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    const already = await prisma.membership.findUnique({
      where: { studioId_userId: { studioId: studio.id, userId: existingUser.id } },
    });
    if (already) return { error: "Questa persona fa già parte del team." };

    await prisma.membership.create({ data: { studioId: studio.id, userId: existingUser.id, role: "MEMBER" } });
    revalidatePath("/app/impostazioni");
    return { success: `${email} aveva già un account: aggiunto al team dello studio.` };
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({ data: { email, name: name || null, passwordHash } });
    await tx.membership.create({ data: { studioId: studio.id, userId: newUser.id, role: "MEMBER" } });
  });

  revalidatePath("/app/impostazioni");
  return {
    success: `Account creato per ${email}. Password temporanea: ${tempPassword} — condividila in modo sicuro (WhatsApp, email): potrà usarla per accedere.`,
  };
}

export async function removeMember(membershipId: string) {
  const { studio, isOwner } = await requireOwner();
  if (!isOwner) return;

  const target = await prisma.membership.findFirst({ where: { id: membershipId, studioId: studio.id } });
  if (!target || target.role === "OWNER") return;

  await prisma.membership.delete({ where: { id: membershipId } });
  revalidatePath("/app/impostazioni");
}
