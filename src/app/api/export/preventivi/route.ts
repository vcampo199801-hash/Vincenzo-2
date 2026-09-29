import { NextRequest, NextResponse } from "next/server";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/compliance";
import { optionLabelKpi, FASCIA_ETA_OPTIONS, TIPO_PAZIENTE_OPTIONS, MODALITA_PAGAMENTO_OPTIONS, MOTIVO_RIFIUTO_OPTIONS } from "@/lib/kpi";
import { toCsv } from "@/lib/csv";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { studio } = await requireActiveSubscription("kpi");
  const params = req.nextUrl.searchParams;
  const dottore = params.get("dottore") ?? "";
  const commerciale = params.get("commerciale") ?? "";
  const stato = params.get("stato") ?? "";
  const assicurazione = params.get("assicurazione") ?? "";

  const tutti = await prisma.preventivo.findMany({ where: { studioId: studio.id }, orderBy: { data: "desc" } });
  const filtrati = tutti.filter(
    (p) =>
      (!dottore || p.dottore === dottore) &&
      (!commerciale || p.commerciale === commerciale) &&
      (!stato || p.stato === stato) &&
      (!assicurazione || p.assicurazione === assicurazione)
  );

  const righe = filtrati.map((p) => ({
    data: formatDate(p.data),
    paziente: p.pazienteNome ?? "",
    eta: optionLabelKpi(FASCIA_ETA_OPTIONS, p.fasciaEta),
    tipoPaziente: p.tipoPaziente ? optionLabelKpi(TIPO_PAZIENTE_OPTIONS, p.tipoPaziente) : "",
    dottore: p.dottore,
    commerciale: p.commerciale ?? "",
    comeCiHaConosciuto: p.comeCiHaConosciuto ?? "",
    proposto: p.totaleProposto,
    accettato: p.totaleAccettato ?? "",
    dataAccettazione: p.dataAccettazione ? formatDate(p.dataAccettazione) : "",
    listino: p.importoListino ?? "",
    copertoAssicurazione: p.importoAssicurazione ?? "",
    scadenza: p.scadenza ? formatDate(p.scadenza) : "",
    assicurazione: p.assicurazione ?? "",
    pagamento: optionLabelKpi(MODALITA_PAGAMENTO_OPTIONS, p.modalitaPagamento),
    stato: p.stato,
    motivoRifiuto: p.stato === "RIFIUTATO" && p.motivoRifiuto ? optionLabelKpi(MOTIVO_RIFIUTO_OPTIONS, p.motivoRifiuto) : "",
    note: p.note ?? "",
  }));

  const csv = toCsv(righe, [
    { key: "data", label: "Data" },
    { key: "paziente", label: "Paziente" },
    { key: "eta", label: "Età" },
    { key: "tipoPaziente", label: "Tipo paziente" },
    { key: "dottore", label: "Dottore" },
    { key: "commerciale", label: "Commerciale" },
    { key: "comeCiHaConosciuto", label: "Come ci ha conosciuto" },
    { key: "proposto", label: "Proposto" },
    { key: "accettato", label: "Accettato" },
    { key: "dataAccettazione", label: "Data accettazione" },
    { key: "listino", label: "Listino" },
    { key: "copertoAssicurazione", label: "Coperto assicurazione" },
    { key: "scadenza", label: "Scadenza" },
    { key: "assicurazione", label: "Assicurazione" },
    { key: "pagamento", label: "Pagamento" },
    { key: "stato", label: "Stato" },
    { key: "motivoRifiuto", label: "Motivo rifiuto" },
    { key: "note", label: "Note" },
  ]);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="preventivi.csv"`,
    },
  });
}
