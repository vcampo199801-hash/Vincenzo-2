import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subscriptionEntitled } from "@/lib/auth-guards";
import { pianoConsenteModulo } from "@/lib/plans";
import { scadenzaStato } from "@/lib/compliance";
import { buildIcs, type IcsEvent } from "@/lib/ics";

// Feed pubblico (nessuna sessione): protetto dal solo token nell'URL, così
// Google/Apple Calendar possono interrogarlo periodicamente da soli, senza
// login. Non prerenderizzare né mettere in cache: deve riflettere lo stato
// aggiornato ad ogni sincronizzazione del calendario dell'utente.
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token) return new NextResponse("Not found", { status: 404 });

  const studio = await prisma.studio.findUnique({
    where: { calendarioToken: token },
    include: { subscription: true },
  });
  if (!studio || !subscriptionEntitled(studio.subscription)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const plan = studio.subscription!.plan;
  const events: IcsEvent[] = [];

  const adempimenti = await prisma.adempimento.findMany({ where: { studioId: studio.id } });
  for (const a of adempimenti) {
    const { prossimaScadenza } = scadenzaStato(a.dataUltimoControllo, a.mesi);
    if (!prossimaScadenza) continue;
    events.push({
      uid: `adempimento-${a.id}`,
      title: `Scadenza: ${a.nome}`,
      date: prossimaScadenza,
      description: a.riferimento ?? undefined,
      alarmDaysBefore: 7,
    });
  }

  if (pianoConsenteModulo(plan, "laboratori")) {
    const lavorazioni = await prisma.lavorazione.findMany({
      where: { studioId: studio.id, dataConsegnaEffettiva: null, dataConsegnaPrevista: { not: null } },
      include: { laboratorio: true },
    });
    for (const l of lavorazioni) {
      if (!l.dataConsegnaPrevista) continue;
      events.push({
        uid: `lavorazione-${l.id}`,
        title: `Consegna laboratorio: ${l.riferimentoPaziente}`,
        date: l.dataConsegnaPrevista,
        description: l.laboratorio.ragioneSociale,
        alarmDaysBefore: 2,
      });
    }
  }

  const ics = buildIcs(`${studio.name} — Scadenze in Regola`, events);

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
