import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePersonaleAccess } from "@/lib/auth-guards";
import { logPersonaleAccess } from "@/lib/personale-access-log";
import { buildCsv } from "@/lib/csv";
import { DIPENDENTE_CSV_HEADERS } from "@/lib/personale";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

// ISO (yyyy-mm-dd), not the Italian dd/mm/yyyy display format — this needs to
// round-trip cleanly through re-import and through the consultant's own tools.
function isoDate(d: Date | null) {
  return d ? d.toISOString().slice(0, 10) : "";
}

export async function GET() {
  const { studio, session } = await requirePersonaleAccess();

  const dipendenti = await prisma.dipendente.findMany({
    where: { studioId: studio.id },
    orderBy: [{ cognome: "asc" }, { nome: "asc" }],
  });

  const rows = dipendenti.map((d) => [
    d.nome,
    d.cognome,
    d.codiceFiscale,
    isoDate(d.dataNascita),
    d.mansione,
    d.tipoContratto,
    d.ccnl,
    d.livello,
    isoDate(d.dataAssunzione),
    isoDate(d.dataFineContratto),
    d.oreSettimanali,
    isoDate(d.finePeriodoProva),
    d.stato,
    d.note,
  ]);

  await logPersonaleAccess({ studioId: studio.id, userId: session.userId, azione: "EXPORT_CSV" });

  const csv = buildCsv(DIPENDENTE_CSV_HEADERS, rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="dipendenti.csv"`,
    },
  });
}
