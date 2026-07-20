import { NextResponse } from "next/server";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { scadenzaStato } from "@/lib/compliance";
import { buildIcs } from "@/lib/ics";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export async function GET() {
  const { studio } = await requireActiveSubscription();

  const adempimenti = await prisma.adempimento.findMany({ where: { studioId: studio.id } });

  const events = adempimenti
    .map((a) => ({ a, ...scadenzaStato(a.dataUltimoControllo, a.mesi) }))
    .filter((s): s is typeof s & { prossimaScadenza: Date } => s.prossimaScadenza !== null)
    .map((s) => ({
      uid: s.a.id,
      title: `Scadenza: ${s.a.nome}`,
      date: s.prossimaScadenza,
      description: s.a.riferimento ?? undefined,
      alarmDaysBefore: 7,
    }));

  const ics = buildIcs(`${studio.name} — Scadenze in Regola`, events);

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="scadenze-in-regola.ics"`,
    },
  });
}
