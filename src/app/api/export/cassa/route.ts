import { NextRequest, NextResponse } from "next/server";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/compliance";
import { toIsoDate } from "@/lib/kpi";
import { TIPO_MOVIMENTO_OPTIONS, MODALITA_INCASSO_OPTIONS, optionLabelCassa } from "@/lib/cassa";
import { toCsv } from "@/lib/csv";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { studio } = await requireActiveSubscription("kpi");
  const params = req.nextUrl.searchParams;
  const tipo = params.get("tipo") ?? "";
  const da = params.get("da") ?? "";
  const a = params.get("a") ?? "";

  const movimenti = await prisma.movimentoCassa.findMany({ where: { studioId: studio.id }, orderBy: { data: "desc" } });
  const filtrati = movimenti.filter((m) => {
    if (tipo && m.tipo !== tipo) return false;
    if (da && toIsoDate(m.data) < da) return false;
    if (a && toIsoDate(m.data) > a) return false;
    return true;
  });

  const righe = filtrati.map((m) => ({
    data: formatDate(m.data),
    tipo: optionLabelCassa([...TIPO_MOVIMENTO_OPTIONS], m.tipo),
    importo: m.importo,
    modalita: m.modalitaIncasso ? optionLabelCassa([...MODALITA_INCASSO_OPTIONS], m.modalitaIncasso) : "",
    numeroFattura: m.numeroFattura ?? "",
    nominativo: m.nominativo ?? "",
    note: m.note ?? "",
  }));

  const csv = toCsv(righe, [
    { key: "data", label: "Data" },
    { key: "tipo", label: "Tipo" },
    { key: "importo", label: "Importo" },
    { key: "modalita", label: "Modalità" },
    { key: "numeroFattura", label: "N. fattura" },
    { key: "nominativo", label: "Nominativo" },
    { key: "note", label: "Note" },
  ]);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cassa.csv"`,
    },
  });
}
