import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isEmailConfigured } from "@/lib/email";
import { sendDigestForStudio } from "@/lib/notifications";
import { sendTrialAlertForStudio } from "@/lib/trial-alerts";

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
    return NextResponse.json({ skipped: "no-channel-configured" }, { status: 200 });
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

  // Promemoria/scadenza prova gratuita: indipendente da notificheAttive
  // (riguarda l'abbonamento, non gli avvisi di scadenza normativa), quindi
  // una query separata su tutti gli studi in prova.
  const studiInProva = await prisma.studio.findMany({
    where: { email: { not: null }, subscription: { status: "TRIALING" } },
    include: { subscription: true },
  });

  let trialSent = 0;
  let trialFailed = 0;
  for (const studio of studiInProva) {
    try {
      const esito = await sendTrialAlertForStudio(studio);
      if (esito) trialSent++;
    } catch (err) {
      trialFailed++;
      console.error(`Trial alert email failed for studio ${studio.id}:`, err);
    }
  }

  return NextResponse.json({ checked: studios.length, sent, failed, trialChecked: studiInProva.length, trialSent, trialFailed });
}
