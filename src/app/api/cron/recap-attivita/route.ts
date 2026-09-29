import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isEmailConfigured } from "@/lib/email";
import { sendRecapAttivitaForStudio } from "@/lib/recap-attivita";

export const dynamic = "force-dynamic";

const ENTITLED_STATUSES = new Set(["ACTIVE", "TRIALING"]);

// Gira a fine giornata (vedi vercel.json), non alla mattina come il digest
// scadenze: un recap di "cosa è successo oggi" ha senso solo a lavoro
// concluso, non a giornata appena iniziata.
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
    where: { recapAttivitaAttivo: true },
    include: { subscription: true },
  });

  let sent = 0;
  let failed = 0;
  for (const studio of studios) {
    const status = studio.subscription?.status;
    if (!status || !ENTITLED_STATUSES.has(status)) continue;
    try {
      const didSend = await sendRecapAttivitaForStudio(studio);
      if (didSend) sent++;
    } catch (err) {
      failed++;
      console.error(`Recap attività email failed for studio ${studio.id}:`, err);
    }
  }

  return NextResponse.json({ checked: studios.length, sent, failed });
}
