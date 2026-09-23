import Link from "next/link";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/compliance";
import { toIsoDate } from "@/lib/kpi";
import { TIPO_MOVIMENTO_OPTIONS, MODALITA_INCASSO_OPTIONS, optionLabelCassa } from "@/lib/cassa";
import { deleteMovimentoCassa, salvaChiusuraPos } from "@/lib/actions/cassa";
import { KpiTabs } from "@/components/app/kpi-tabs";
import { PageHeader } from "@/components/ui/page-header";
import { Field, SubmitButton } from "@/components/ui/form";
import { DeleteButton } from "@/components/ui/delete-button";
import { TableScroll } from "@/components/ui/table-scroll";
import { UnsavedChangesGuard } from "@/components/app/unsaved-changes-guard";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

type SearchParams = { tipo?: string; da?: string; a?: string; posData?: string };

export default async function CassaPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { studio } = await requireActiveSubscription("kpi");
  const params = await searchParams;

  // new Date(toIsoDate(...)) normalizza a mezzanotte UTC: senza questo, il
  // valore di default (oggi, con l'ora corrente) non troverebbe mai la riga
  // già salvata a mezzanotte, mostrando sempre 0 anche appena dopo un salvataggio.
  const posDataSelezionata = params.posData ? new Date(params.posData) : new Date(toIsoDate(new Date()));

  const [movimenti, giornoPos, giorniKpi] = await Promise.all([
    prisma.movimentoCassa.findMany({ where: { studioId: studio.id }, orderBy: { data: "desc" } }),
    prisma.kpiGiornaliero.findFirst({ where: { studioId: studio.id, data: posDataSelezionata } }),
    prisma.kpiGiornaliero.findMany({ where: { studioId: studio.id }, select: { data: true, chiusuraPos: true } }),
  ]);

  const filtrati = movimenti.filter((m) => {
    if (params.tipo && m.tipo !== params.tipo) return false;
    if (params.da && toIsoDate(m.data) < params.da) return false;
    if (params.a && toIsoDate(m.data) > params.a) return false;
    return true;
  });

  const incassi = filtrati.filter((m) => m.tipo === "INCASSO");
  const totaleContanti = incassi.filter((m) => m.modalitaIncasso === "CONTANTI").reduce((s, m) => s + m.importo, 0);
  const totaleAssegni = incassi.filter((m) => m.modalitaIncasso === "ASSEGNO").reduce((s, m) => s + m.importo, 0);
  const totaleBonifici = incassi.filter((m) => m.modalitaIncasso === "BONIFICO").reduce((s, m) => s + m.importo, 0);
  // Il totale POS non è un movimento come gli altri (vedi chiusuraPos su
  // KpiGiornaliero): lo si somma qui solo se il filtro Tipo non esclude già
  // gli incassi, così i totali restano coerenti con quel filtro.
  const totalePos =
    !params.tipo || params.tipo === "INCASSO"
      ? giorniKpi
          .filter((g) => (!params.da || toIsoDate(g.data) >= params.da) && (!params.a || toIsoDate(g.data) <= params.a))
          .reduce((s, g) => s + g.chiusuraPos, 0)
      : 0;
  const totaleIncassi = totaleContanti + totaleAssegni + totaleBonifici + totalePos;
  const totalePrelievi = filtrati.filter((m) => m.tipo === "PRELIEVO").reduce((s, m) => s + m.importo, 0);
  const totaleVersamenti = filtrati.filter((m) => m.tipo === "VERSAMENTO").reduce((s, m) => s + m.importo, 0);

  return (
    <div>
      <PageHeader
        title="Cassa"
        description="Incassi, prelievi e versamenti — gli incassi (più la chiusura POS qui sotto) alimentano da soli il fatturato in “Andamento”."
        action="+ Nuovo movimento"
        actionHref="/app/kpi/cassa/new"
      />

      <KpiTabs />

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold text-slate-900">Chiusura POS giornaliera</h2>
        <p className="mb-4 text-xs text-slate-500">
          Un totale unico al giorno (non per singola transazione) — si somma agli incassi in contanti/assegno dello
          stesso giorno per formare il fatturato.
        </p>
        <UnsavedChangesGuard>
          <form action={salvaChiusuraPos} className="flex flex-wrap items-end gap-4">
            <Field label="Data" name="data" type="date" required defaultValue={toIsoDate(posDataSelezionata)} />
            <Field label="Totale POS (€)" name="chiusuraPos" type="number" step="0.01" defaultValue={giornoPos?.chiusuraPos ?? 0} />
            <SubmitButton>Salva chiusura</SubmitButton>
          </form>
        </UnsavedChangesGuard>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-500">Totale incassi — contanti+POS+assegni+bonifici (periodo filtrato)</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{formatCurrency(totaleIncassi)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-500">Totale prelievi (periodo filtrato)</p>
          <p className="mt-1 text-2xl font-bold text-red-700">{formatCurrency(totalePrelievi)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-500">Totale versamenti (periodo filtrato)</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(totaleVersamenti)}</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Contanti</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(totaleContanti)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">POS</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(totalePos)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Assegni</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(totaleAssegni)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Bonifici</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(totaleBonifici)}</p>
        </div>
      </div>

      <form className="mb-4 flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Tipo</span>
          <select
            name="tipo"
            defaultValue={params.tipo ?? ""}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
          >
            <option value="">Tutti</option>
            {TIPO_MOVIMENTO_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Da</span>
          <input type="date" name="da" defaultValue={params.da ?? ""} className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">A</span>
          <input type="date" name="a" defaultValue={params.a ?? ""} className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm" />
        </label>
        <button type="submit" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Filtra
        </button>
        {(params.tipo || params.da || params.a) && (
          <Link href="/app/kpi/cassa" className="text-sm font-medium text-brand-600 hover:underline">
            Azzera filtri
          </Link>
        )}
      </form>

      <TableScroll className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Importo</th>
              <th className="px-4 py-3">Modalità</th>
              <th className="px-4 py-3">N. fattura</th>
              <th className="px-4 py-3">Nominativo</th>
              <th className="px-4 py-3">Note</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtrati.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{formatDate(m.data)}</td>
                <td className="px-4 py-3 text-slate-600">{optionLabelCassa([...TIPO_MOVIMENTO_OPTIONS], m.tipo)}</td>
                <td className="px-4 py-3 text-slate-600">{formatCurrency(m.importo)}</td>
                <td className="px-4 py-3 text-slate-600">{m.modalitaIncasso ? optionLabelCassa([...MODALITA_INCASSO_OPTIONS], m.modalitaIncasso) : "—"}</td>
                <td className="px-4 py-3 text-slate-600">{m.numeroFattura ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{m.nominativo ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{m.note ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/app/kpi/cassa/${m.id}/edit`} className="text-sm font-medium text-brand-600 hover:text-brand-800">
                      Modifica
                    </Link>
                    <DeleteButton action={deleteMovimentoCassa.bind(null, m.id)} />
                  </div>
                </td>
              </tr>
            ))}
            {filtrati.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  Nessun movimento di cassa registrato finora.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableScroll>
    </div>
  );
}
