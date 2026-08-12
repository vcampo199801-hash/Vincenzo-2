import Link from "next/link";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/compliance";
import {
  serieUltimiGiorni,
  serieMensile,
  serieSemestrale,
  serieAnnuale,
  tassoConversionePreventivi,
  KPI_METRICHE,
  toIsoDate,
  type KpiMetricaKey,
  type KpiRiga,
} from "@/lib/kpi";
import { salvaKpiGiorno, deleteKpiGiorno } from "@/lib/actions/kpi";
import { PageHeader } from "@/components/ui/page-header";
import { Field, TextAreaField, SubmitButton } from "@/components/ui/form";
import { DeleteButton } from "@/components/ui/delete-button";
import { TrendBars } from "@/components/charts/trend-bars";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

const PERIODI = [
  { value: "giorni", label: "Ultimi 14 giorni" },
  { value: "mese", label: "Mensile" },
  { value: "semestre", label: "Semestrale" },
  { value: "anno", label: "Annuale" },
] as const;
type Periodo = (typeof PERIODI)[number]["value"];

function serieMetrica(righe: KpiRiga[], periodo: Periodo, metrica: KpiMetricaKey, anno: number, oggi: Date) {
  if (periodo === "mese") return serieMensile(righe, anno, metrica);
  if (periodo === "semestre") return serieSemestrale(righe, anno, metrica);
  if (periodo === "anno") return serieAnnuale(righe, metrica);
  return serieUltimiGiorni(righe, 14, metrica, oggi);
}

function titoloPeriodo(periodo: Periodo, anno: number) {
  if (periodo === "mese") return `Andamento mensile — anno ${anno}`;
  if (periodo === "semestre") return `Andamento semestrale — anno ${anno}`;
  if (periodo === "anno") return "Andamento annuale";
  return "Ultimi 14 giorni";
}

export default async function KpiPage({ searchParams }: { searchParams: Promise<{ data?: string; periodo?: string }> }) {
  const { studio } = await requireActiveSubscription("kpi");
  const params = await searchParams;

  const oggi = new Date();
  const dataSelezionata = params.data ? new Date(params.data) : oggi;
  const isModifica = Boolean(params.data);
  const periodo: Periodo = PERIODI.some((p) => p.value === params.periodo) ? (params.periodo as Periodo) : "giorni";
  const anno = oggi.getUTCFullYear();

  const [righe, righeGiornoSelezionato] = await Promise.all([
    prisma.kpiGiornaliero.findMany({ where: { studioId: studio.id }, orderBy: { data: "desc" } }),
    prisma.kpiGiornaliero.findFirst({ where: { studioId: studio.id, data: dataSelezionata } }),
  ]);

  const serieVisibili = KPI_METRICHE.map((m) => ({
    ...m,
    serie: serieMetrica(righe, periodo, m.key, anno, oggi),
  }));
  const totalePresentati = serieVisibili.find((m) => m.key === "valorePreventiviPresentati")!.serie.reduce((s, x) => s + x.value, 0);
  const totaleAccettati = serieVisibili.find((m) => m.key === "valorePreventiviAccettati")!.serie.reduce((s, x) => s + x.value, 0);
  const conversionePeriodo = tassoConversionePreventivi(totalePresentati, totaleAccettati);

  return (
    <div>
      <PageHeader
        title="KPI Studio"
        description="Inserisci ogni giorno pochi numeri chiave: fatturato, prime visite, appuntamenti e preventivi. L'app costruisce da sola i riepiloghi mensili e annuali."
      />

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          {isModifica ? `Modifica i dati del ${formatDate(dataSelezionata)}` : "Inserisci i dati di oggi"}
        </h2>
        <form action={salvaKpiGiorno} className="space-y-4">
          <Field label="Data" name="data" type="date" required defaultValue={toIsoDate(dataSelezionata)} />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="N. prime visite" name="numeroPrimeVisite" type="number" defaultValue={righeGiornoSelezionato?.numeroPrimeVisite ?? 0} />
            <Field label="N. appuntamenti" name="numeroAppuntamenti" type="number" defaultValue={righeGiornoSelezionato?.numeroAppuntamenti ?? 0} />
            <Field label="Fatturato (€)" name="fatturato" type="number" step="0.01" defaultValue={righeGiornoSelezionato?.fatturato ?? 0} />
            <Field
              label="Preventivi presentati (€)"
              name="valorePreventiviPresentati"
              type="number"
              step="0.01"
              defaultValue={righeGiornoSelezionato?.valorePreventiviPresentati ?? 0}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field
              label="Preventivi accettati (€)"
              name="valorePreventiviAccettati"
              type="number"
              step="0.01"
              defaultValue={righeGiornoSelezionato?.valorePreventiviAccettati ?? 0}
              hint="Del totale presentato, quanto è stato firmato."
            />
          </div>
          <TextAreaField label="Note" name="note" defaultValue={righeGiornoSelezionato?.note} />
          <SubmitButton>{isModifica ? "Salva modifiche" : "Salva i dati di oggi"}</SubmitButton>
        </form>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {PERIODI.map((p) => (
          <Link
            key={p.value}
            href={`/app/kpi?periodo=${p.value}`}
            className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium ${
              periodo === p.value ? "bg-brand-600 text-white" : "border border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {serieVisibili.map((m) => {
          const totale = m.serie.reduce((s, x) => s + x.value, 0);
          const formatValue = m.isCurrency ? formatCurrency : (v: number) => String(v);
          return (
            <div key={m.key} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-1 text-sm font-semibold text-slate-900">{m.label}</h2>
              <p className="mb-4 text-xs text-slate-500">
                {titoloPeriodo(periodo, anno)} — Totale: {formatValue(totale)}
              </p>
              <TrendBars items={m.serie} formatValue={formatValue} barAreaHeight={72} />
            </div>
          );
        })}

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-slate-900">Tasso di conversione</h2>
          <p className="mb-4 text-xs text-slate-500">{titoloPeriodo(periodo, anno)}</p>
          <p className="text-3xl font-semibold text-slate-900">{conversionePeriodo === null ? "—" : `${conversionePeriodo}%`}</p>
          <p className="mt-2 text-xs text-slate-500">Preventivi accettati sul totale presentato nel periodo selezionato.</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Prime visite</th>
              <th className="px-4 py-3">Appuntamenti</th>
              <th className="px-4 py-3">Fatturato</th>
              <th className="px-4 py-3">Preventivi presentati</th>
              <th className="px-4 py-3">Preventivi accettati</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {righe.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{formatDate(r.data)}</td>
                <td className="px-4 py-3 text-slate-600">{r.numeroPrimeVisite}</td>
                <td className="px-4 py-3 text-slate-600">{r.numeroAppuntamenti}</td>
                <td className="px-4 py-3 text-slate-600">{formatCurrency(r.fatturato)}</td>
                <td className="px-4 py-3 text-slate-600">{formatCurrency(r.valorePreventiviPresentati)}</td>
                <td className="px-4 py-3 text-slate-600">{formatCurrency(r.valorePreventiviAccettati)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <a href={`/app/kpi?data=${toIsoDate(r.data)}`} className="text-sm font-medium text-brand-600 hover:text-brand-800">
                      Modifica
                    </a>
                    <DeleteButton action={deleteKpiGiorno.bind(null, r.id)} />
                  </div>
                </td>
              </tr>
            ))}
            {righe.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Nessun dato inserito finora.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
