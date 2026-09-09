"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireStudio } from "@/lib/auth-guards";
import { APP_MODULES } from "@/lib/modules";
import { PIANI, normalizzaPiano } from "@/lib/plans";
import { sendEmail, isEmailConfigured } from "@/lib/email";

export type TeamFormState = { error?: string; success?: string } | undefined;

const TEMP_PASSWORD_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function generateTempPassword(length = 10) {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += TEMP_PASSWORD_ALPHABET[Math.floor(Math.random() * TEMP_PASSWORD_ALPHABET.length)];
  }
  return out;
}

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function emailWrapper(titolo: string, corpo: string) {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;max-width:560px;margin:0 auto;">
      <h1 style="font-size:18px;color:#3d7076;">Scadenze in Regola</h1>
      <p style="font-weight:bold;">${titolo}</p>
      ${corpo}
      <p style="margin-top:24px;">
        <a href="${appUrl()}/login" style="background:#4e888f;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px;">
          Accedi
        </a>
      </p>
    </div>
  `;
}

/** Non deve mai far fallire l'invito se l'invio fallisce (Resend non configurato,
 * errore di rete, ecc.): l'account/il collegamento al team sono già stati creati
 * nel database a questo punto, quindi va sempre chiamata dentro un try/catch —
 * la password temporanea resta comunque visibile a schermo come ripiego. */
async function sendInviteEmail(params: { email: string; studioName: string; nuovoAccount: boolean; tempPassword?: string }) {
  if (!isEmailConfigured()) return;

  const corpo = params.nuovoAccount
    ? `<p>Sei stato invitato a collaborare con <strong>${escapeHtml(params.studioName)}</strong> su Scadenze in Regola.</p>
       <p>Ecco le tue credenziali per accedere:</p>
       <p>Email: <strong>${escapeHtml(params.email)}</strong><br/>Password temporanea: <strong>${escapeHtml(params.tempPassword ?? "")}</strong></p>`
    : `<p>Sei stato aggiunto al team di <strong>${escapeHtml(params.studioName)}</strong> su Scadenze in Regola. Puoi accedere con le
       credenziali che usi già per il tuo account.</p>`;

  await sendEmail({
    to: params.email,
    subject: `Sei stato invitato su Scadenze in Regola — ${params.studioName}`,
    html: emailWrapper("Ti hanno invitato a collaborare", corpo),
  });
}

async function requireOwner() {
  const { session, studio, membership } = await requireStudio();
  return { session, studio, isOwner: membership.role === "OWNER" };
}

/** Reads the "modulo_<key>" checkboxes from the invite/permessi form. Every box
 * checked (or the form omitted entirely) means unrestricted access — we only
 * store a restriction when the owner has explicitly unchecked something. */
function readPermessi(formData: FormData): string | null {
  const checked = APP_MODULES.filter((m) => formData.get(`modulo_${m.key}`) === "on").map((m) => m.key);
  if (checked.length === APP_MODULES.length) return null;
  return JSON.stringify(checked);
}

export async function inviteMember(_prev: TeamFormState, formData: FormData): Promise<TeamFormState> {
  const { studio, isOwner } = await requireOwner();
  if (!isOwner) return { error: "Solo il titolare dello studio può invitare collaboratori." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  if (!email) return { error: "Inserisci un'email." };

  const maxCollaboratori = PIANI[normalizzaPiano(studio.subscription?.plan)].maxCollaboratori;
  const collaboratorCount = await prisma.membership.count({ where: { studioId: studio.id, role: "MEMBER" } });
  if (collaboratorCount >= maxCollaboratori) {
    return {
      error: `Hai già ${maxCollaboratori} collaborat${maxCollaboratori === 1 ? "ore" : "ori"}, il massimo per il tuo piano. Passa a un piano superiore per invitarne altri.`,
    };
  }

  const permessi = readPermessi(formData);
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    const already = await prisma.membership.findUnique({
      where: { studioId_userId: { studioId: studio.id, userId: existingUser.id } },
    });
    if (already) return { error: "Questa persona fa già parte del team." };

    await prisma.membership.create({
      data: { studioId: studio.id, userId: existingUser.id, role: "MEMBER", permessi },
    });
    revalidatePath("/app/impostazioni");

    try {
      await sendInviteEmail({ email, studioName: studio.name, nuovoAccount: false });
    } catch {
      return { success: `${email} aveva già un account: aggiunto al team dello studio. Non siamo però riusciti a inviargli l'email di notifica: avvisalo tu direttamente.` };
    }
    return { success: `${email} aveva già un account: aggiunto al team dello studio. Gli abbiamo inviato una email di notifica.` };
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({ data: { email, name: name || null, passwordHash } });
    await tx.membership.create({ data: { studioId: studio.id, userId: newUser.id, role: "MEMBER", permessi } });
  });

  revalidatePath("/app/impostazioni");

  try {
    await sendInviteEmail({ email, studioName: studio.name, nuovoAccount: true, tempPassword });
  } catch {
    return {
      success: `Account creato per ${email}, ma non siamo riusciti a inviargli l'email con le credenziali. Password temporanea: ${tempPassword} — condividila tu in modo sicuro (WhatsApp, email).`,
    };
  }
  return {
    success: `Account creato per ${email}: gli abbiamo inviato via email le credenziali per accedere. Password temporanea (nel caso non gli fosse arrivata): ${tempPassword}`,
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

export async function updateMemberPermessi(
  membershipId: string,
  _prev: TeamFormState,
  formData: FormData
): Promise<TeamFormState> {
  const { studio, isOwner } = await requireOwner();
  if (!isOwner) return { error: "Solo il titolare dello studio può modificare i permessi." };

  const target = await prisma.membership.findFirst({ where: { id: membershipId, studioId: studio.id } });
  if (!target || target.role === "OWNER") return { error: "Permessi non modificabili per questo utente." };

  await prisma.membership.update({ where: { id: membershipId }, data: { permessi: readPermessi(formData) } });
  revalidatePath("/app/impostazioni");
  return { success: "Permessi aggiornati." };
}
