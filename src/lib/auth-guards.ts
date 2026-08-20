import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { hasModuleAccess, firstAccessibleHref, type ModuleKey } from "@/lib/modules";
import { pianoConsenteModulo } from "@/lib/plans";

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireStudio(moduleKey?: ModuleKey) {
  const session = await requireSession();

  const membership = await prisma.membership.findUnique({
    where: { studioId_userId: { studioId: session.studioId, userId: session.userId } },
  });
  if (!membership) redirect("/login");

  const studio = await prisma.studio.findUnique({
    where: { id: session.studioId },
    include: { subscription: true },
  });
  if (!studio) redirect("/login");

  if (moduleKey && !hasModuleAccess(membership.permessi, membership.role, moduleKey)) {
    redirect(firstAccessibleHref(membership.permessi, membership.role));
  }

  return { session, studio, membership };
}

const ENTITLED_STATUSES = new Set(["ACTIVE", "TRIALING"]);

export async function requireActiveSubscription(moduleKey?: ModuleKey) {
  const { session, studio } = await requireStudio(moduleKey);
  const sub = studio.subscription;

  const trialExpired =
    sub?.status === "TRIALING" && sub.trialEndsAt !== null && sub.trialEndsAt < new Date();

  const entitled = sub && ENTITLED_STATUSES.has(sub.status) && !trialExpired;

  if (!entitled) {
    redirect("/app/abbonamento");
  }

  if (moduleKey && !pianoConsenteModulo(sub!.plan, moduleKey)) {
    redirect(`/app/abbonamento?upgrade=${moduleKey}`);
  }

  return { session, studio, subscription: sub! };
}

/** true se l'email è nella lista di fiducia ADMIN_EMAILS (env var, separata da
 * virgole) — usata sia per proteggere le pagine /admin sia per decidere se
 * mostrare la voce "Admin" nel menu di chi ha effettuato l'accesso. */
export function isAdminEmail(email: string): boolean {
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}

/** Pagine di gestione della piattaforma (es. monitoraggio fatturazione), riservate
 * al titolare — non a un ruolo dentro uno studio, ma a una lista di email fidate
 * impostata via env var. Nessuno studio, incluso il proprio, vede queste pagine. */
export async function requireAdmin() {
  const session = await requireSession();
  if (!isAdminEmail(session.email)) redirect("/app");
  return { session };
}
