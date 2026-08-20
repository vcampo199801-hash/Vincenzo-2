import Link from "next/link";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { formatDate, formatCurrency } from "@/lib/compliance";
import { PageHeader } from "@/components/ui/page-header";
import { TableScroll } from "@/components/ui/table-scroll";
import {
  PERIODI_BILANCIO,
  type PeriodoBilancio,
  toIsoDate,
  inizioMese,
  fineMese,
  inizioAnno,
  fineAnno,
  MESI_LABELS,
} from "@/lib/kpi";

export const dynamic = "force-dynamic";

export default async function ResocontoMagazzinoPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; da?: string; a?: string }>;
}) {
  const { studio } = await requireActiveSubscription("magazzino");
  const params = await searchParams;

  const now = new Date();
  const anno = now.getUTCFullYear();
  const periodo: PeriodoBilancio = PERIODI_BILANCIO.some((p) => p.value === params.periodo)
    ? (params.periodo as PeriodoBilancio)
    : "mensile";

  const daDefault = toIsoDate(inizioAnno(anno));
  const aDefault = toIsoDate(now);
  const daIso = params.da || daDefault;
  const aIso = params.a || aDefault;

  let dataInizio: Date;
  let dataFine: Date;
  let titolo: string;
  if (periodo === "mensile") {
    dataInizio = inizioMese(anno, now.getUTCMonth());
    dataFine = fineMese(anno, now.getUTCMonth());
    titolo = `mese di ${MESI_LABELS[now.getUTCMonth()]} ${anno}`;
  } else if (periodo === "personalizzato") {
    dataInizio = new Date(daIso);
    dataFine = new Date(aIso);
    titolo = `dal ${formatDate(dataInizio)} al ${formatDate(dataFine)}`;
  } else {
    dataInizio = inizioAnno(anno);
    dataFine = fineAnno(anno);
    titolo = `anno ${anno}`;
  }

  const movimenti = await prisma.movimentoMagazzino.findMany({
    where: { studioId: studio.id, data: { gte: dataInizio, lte: dataFine } },
    include: { magazzinoItem: true },
    orderBy: { data: "desc" },
  });

  const totale = movimenti.reduce((s, m) => s + m.costo, 0);
  const perProdotto = Object.values(
    movimenti.reduce<Record<string, { prodotto: string; totale: number }>>((acc, m) => {
      const key = m.magazzinoItemId;
      if (!acc[key]) acc[key] = { prodotto: m.magazzinoItem.prodotto, totale: 0 };
      acc[key].totale += m.costo;
      return acc;
    }, {})
  ).sort((a, b) => b.totale - a.totale);

  return (
    <div>
      <PageHeader
        title="Resoconto spese Magazzino"
        description="Solo i riordini registrati con il bottone «+ Riordino» — le frecce +/- rapide non hanno costo e non compaiono qui."
      />

      <Link href="/app/magazzino" className="text-sm text-slate-500 hover:text-slate-800">
        ← Torna al Magazzino
      </Link>

      <div className="mt-4 mb-4 flex flex-wrap items-center gap-2">
        {PERIODI_BILANCIO.map((p) => (
          <Link
            key={p.value}
            href={`/app/magazzino/resoconto?periodo=${p.value}`}
            scroll={false}
            className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium ${
              periodo === p.value ? "bg-brand-600 text-white" : "border border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {p.label}
          </Link>
        ))}
        {periodo === "personalizzato" && (
          <form method="get" className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="periodo" value="personalizzato" />
            <input type="date" name="da" defaultValue={daIso} className="rounded-lg border border-slate-300 px-2 py-1 text-sm" />
            <span className="text-sm text-slate-400">—</span>
            <input type="date" name="a" defaultValue={aIso} className="rounded-lg border border-slate-300 px-2 py-1 text-sm" />
            <button type="submit" className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200">
              Applica
            </button>
          </form>
        )}
      </div>

      <div className="mb-6 rounded-xl border-2 border-brand-200 bg-white p-5 shadow-md">
        <p className="text-sm text-slate-500">Totale speso — {titolo}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(totale)}</p>
        {!studio.magazzinoInBilancio && (
          <p className="mt-2 text-xs text-amber-600">
            Questo importo non è ancora incluso nel Bilancio generale — attivalo dalla pagina Magazzino se vuoi che ci confluisca.
          </p>
        )}
      </div>

      {perProdotto.length > 0 && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">Per prodotto</p>
          <ul className="space-y-2 text-sm">
            {perProdotto.map((p) => (
              <li key={p.prodotto} className="flex items-center justify-between">
                <span className="text-slate-600">{p.prodotto}</span>
                <span className="font-medium text-slate-900">{formatCurrency(p.totale)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <TableScroll className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Prodotto</th>
              <th className="px-4 py-3">Quantità</th>
              <th className="px-4 py-3">Costo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {movimenti.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-600">{formatDate(m.data)}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{m.magazzinoItem.prodotto}</td>
                <td className="px-4 py-3 text-slate-600">{m.quantita}</td>
                <td className="px-4 py-3 text-slate-600">{formatCurrency(m.costo)}</td>
              </tr>
            ))}
            {movimenti.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Nessun riordino registrato in questo periodo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableScroll>
    </div>
  );
}
