import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireStudio() {
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

  return { session, studio, membership };
}

const ENTITLED_STATUSES = new Set(["ACTIVE", "TRIALING"]);

export async function requireActiveSubscription() {
  const { session, studio } = await requireStudio();
  const sub = studio.subscription;

  const trialExpired =
    sub?.status === "TRIALING" && sub.trialEndsAt !== null && sub.trialEndsAt < new Date();

  const entitled = sub && ENTITLED_STATUSES.has(sub.status) && !trialExpired;

  if (!entitled) {
    redirect("/app/abbonamento");
  }

  return { session, studio, subscription: sub! };
}
