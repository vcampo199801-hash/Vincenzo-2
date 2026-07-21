import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { hasModuleAccess, firstAccessibleHref, type ModuleKey } from "@/lib/modules";

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

  return { session, studio, subscription: sub! };
}

/** Gestione Personale handles special-category data (health, sick leave, fitness
 * certificates) — it is owner-only, always, regardless of any collaborator
 * "permessi" a titolare may have granted elsewhere. There is no toggle for it. */
export async function requirePersonaleAccess() {
  const { session, studio, membership } = await requireStudio();
  if (membership.role !== "OWNER") redirect("/app");

  const sub = studio.subscription;
  const trialExpired = sub?.status === "TRIALING" && sub.trialEndsAt !== null && sub.trialEndsAt < new Date();
  const entitled = sub && ENTITLED_STATUSES.has(sub.status) && !trialExpired;
  if (!entitled) redirect("/app/abbonamento");

  return { session, studio, subscription: sub! };
}
