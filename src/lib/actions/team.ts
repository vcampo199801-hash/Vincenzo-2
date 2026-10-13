"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireStudio } from "@/lib/auth-guards";
import { APP_MODULES } from "@/lib/modules";
import { normalizzaPiano, maxCollaboratoriEffettivo } from "@/lib/plans";
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
       <p>Email: <strong>${escapeHtml(params.email)}</strong><br/>Password temporanea: <strong>${escapeHtml(params.tempPassword ?? "")}</strong></p>
       <p>Al primo accesso ti consigliamo di impostarne una tua: vai su Impostazioni → Account → "Cambia password".</p>`
    : `<p>Sei stato aggiunto al team di <strong>${escapeHtml(params.studioName)}</strong> su Scadenze in Regola. Puoi accedere con le
       credenziali che usi già per il tuo account.</p>`;

  await sendEmail({
    to: params.email,
    subject: `Sei stato invitato su Scadenze in Regola — ${params.studioName}`,
    html: emailWrapper("Ti hanno invitato a collaborare", corpo),
  });
}

async function sendPasswordResetEmail(params: { email: string; studioName: string; tempPassword: string }) {
  if (!isEmailConfigured()) return;

  const corpo = `<p>Il titolare di <strong>${escapeHtml(params.studioName)}</strong> ti ha rigenerato la password di accesso a Scadenze in Regola.</p>
     <p>Ecco le tue nuove credenziali:</p>
     <p>Email: <strong>${escapeHtml(params.email)}</strong><br/>Nuova password temporanea: <strong>${escapeHtml(params.tempPassword)}</strong></p>
     <p>Al primo accesso ti consigliamo di impostarne una tua: vai su Impostazioni → Account → "Cambia password".</p>`;

  await sendEmail({
    to: params.email,
    subject: `Nuova password per Scadenze in Regola — ${params.studioName}`,
    html: emailWrapper("La tua password è stata rigenerata", corpo),
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

  const maxCollaboratori = maxCollaboratoriEffettivo(normalizzaPiano(studio.subscription?.plan), studio.subscription?.postiExtra ?? 0);
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
      data: { studioId: studio.id, userId: existingUser.id, role: "MEMBER", permessi, notificheAttive: true, notificheEmail: email },
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
    // Verificata subito: a differenza di un'iscrizione pubblica (/signup, dove la
    // verifica serve a bloccare email usa-e-getta), qui è il titolare — già un
    // cliente verificato — a scegliere direttamente la persona e a consegnarle le
    // credenziali. Senza questo la collaboratrice resta bloccata al primo accesso
    // con "Devi prima confermare la tua email", senza aver mai ricevuto alcuna
    // email di verifica (solo quella con le credenziali).
    const newUser = await tx.user.create({ data: { email, name: name || null, passwordHash, emailVerificataAt: new Date() } });
    await tx.membership.create({
      data: { studioId: studio.id, userId: newUser.id, role: "MEMBER", permessi, notificheAttive: true, notificheEmail: email },
    });
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

/** Genera una nuova password temporanea per un collaboratore già nel team.
 * Serve soprattutto quando un invito viene ripetuto per la stessa email dopo
 * una rimozione: rimuovere un collaboratore cancella solo il suo
 * collegamento allo studio, non l'account — un nuovo invito alla stessa
 * email lo ricollega senza generare credenziali nuove (vedi inviteMember),
 * quindi se quella password è andata persa il titolare non aveva prima
 * d'ora alcun modo di recuperare l'accesso per lui. */
export async function resetMemberPassword(membershipId: string, _prev: TeamFormState, _formData: FormData): Promise<TeamFormState> {
  const { studio, isOwner } = await requireOwner();
  if (!isOwner) return { error: "Solo il titolare dello studio può reimpostare le password." };

  const target = await prisma.membership.findFirst({ where: { id: membershipId, studioId: studio.id }, include: { user: true } });
  if (!target || target.role === "OWNER") return { error: "Operazione non consentita per questo utente." };

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  await prisma.user.update({ where: { id: target.userId }, data: { passwordHash } });

  try {
    await sendPasswordResetEmail({ email: target.user.email, studioName: studio.name, tempPassword });
  } catch {
    return {
      success: `Nuova password generata per ${target.user.email}, ma non siamo riusciti a inviargliela via email. Password temporanea: ${tempPassword} — condividila tu in modo sicuro.`,
    };
  }
  return {
    success: `Nuova password inviata via email a ${target.user.email}. Password temporanea (nel caso non gli fosse arrivata): ${tempPassword}`,
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
