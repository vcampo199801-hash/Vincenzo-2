import { NextResponse } from "next/server";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { scadenzaStato, formatDate, STATO_LABELS } from "@/lib/compliance";
import { toCsv } from "@/lib/csv";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export async function GET() {
  const { studio } = await requireActiveSubscription("scadenzario");

  const adempimenti = await prisma.adempimento.findMany({ where: { studioId: studio.id }, orderBy: { ordine: "asc" } });

  const righe = adempimenti.map((a) => {
    const { prossimaScadenza, giorni, stato } = scadenzaStato(a.dataUltimoControllo, a.mesi);
    return {
      nome: a.nome,
      riferimento: a.riferimento ?? "",
      periodicita: a.periodicita,
      ultimoControllo: a.dataUltimoControllo ? formatDate(a.dataUltimoControllo) : "",
      prossimaScadenza: prossimaScadenza ? formatDate(prossimaScadenza) : "",
      giorni: giorni ?? "",
      stato: STATO_LABELS[stato] ?? stato,
      note: a.note ?? "",
    };
  });

  const csv = toCsv(righe, [
    { key: "nome", label: "Adempimento" },
    { key: "riferimento", label: "Riferimento normativo" },
    { key: "periodicita", label: "Periodicità" },
    { key: "ultimoControllo", label: "Ultimo controllo" },
    { key: "prossimaScadenza", label: "Prossima scadenza" },
    { key: "giorni", label: "Giorni" },
    { key: "stato", label: "Stato" },
    { key: "note", label: "Note" },
  ]);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="scadenzario.csv"`,
    },
  });
}
