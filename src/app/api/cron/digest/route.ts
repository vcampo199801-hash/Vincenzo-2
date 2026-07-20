import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isEmailConfigured } from "@/lib/email";
import { sendDigestForStudio } from "@/lib/notifications";

export const dynamic = "force-dynamic";

const ENTITLED_STATUSES = new Set(["ACTIVE", "TRIALING"]);

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!isEmailConfigured()) {
    return NextResponse.json({ skipped: "email-not-configured" }, { status: 200 });
  }

  const studios = await prisma.studio.findMany({
    where: { notificheAttive: true, email: { not: null } },
    include: { subscription: true },
  });

  let sent = 0;
  let failed = 0;
  for (const studio of studios) {
    const status = studio.subscription?.status;
    if (!status || !ENTITLED_STATUSES.has(status)) continue;
    try {
      const didSend = await sendDigestForStudio(studio);
      if (didSend) sent++;
    } catch (err) {
      failed++;
      console.error(`Digest email failed for studio ${studio.id}:`, err);
    }
  }

  return NextResponse.json({ checked: studios.length, sent, failed });
}
