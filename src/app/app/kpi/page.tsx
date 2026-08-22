import Link from "next/link";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/compliance";
import {
  serieUltimiGiorni,
  serieGiornalieraIntervallo,
  tassoConversionePreventivi,
  KPI_METRICHE,
  toIsoDate,
  inizioMese,
  fineMese,
  inizioSemestre,
  fineSemestre,
  inizioAnno,
  fineAnno,
  type KpiMetricaKey,
  type KpiRiga,
} from "@/lib/kpi";
import { salvaKpiGiorno, deleteKpiGiorno } from "@/lib/actions/kpi";
import { PageHeader } from "@/components/ui/page-header";
import { Field, TextAreaField, SubmitButton } from "@/components/ui/form";
import { DeleteButton } from "@/components/ui/delete-button";
import { TableScroll } from "@/components/ui/table-scroll";
import { TrendBars } from "@/components/charts/trend-bars";
import { UnsavedChangesGuard } from "@/components/app/unsaved-changes-guard";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

const PERIODI = [
  { value: "settimana", label: "Settimana" },
  { value: "giorni", label: "Ultimi 14 giorni" },
  { value: "mese", label: "Mensile" },
  { value: "semestre", label: "Semestrale" },
  { value: "anno", label: "Annuale" },
] as const;
type Periodo = (typeof PERIODI)[number]["value"];
/** Vista di apertura della pagina: la settimana appena trascorsa, sempre
 * ancorata a oggi (il periodo è ricalcolato a ogni apertura, mai una
 * finestra fissa). */
const PERIODO_DEFAULT: Periodo = "settimana";

/** Intervallo di date del periodo scelto: sempre giorno per giorno, il
 * periodo cambia solo l'ampiezza dell'intervallo mostrato (non aggrega più
 * in barre mensili/semestrali — ogni colonna resta un giorno). */
function intervalloPeriodo(periodo: Periodo, oggi: Date): { inizio: Date; fine: Date } {
  const anno = oggi.getUTCFullYear();
  if (periodo === "mese") {
    return { inizio: inizioMese(anno, oggi.getUTCMonth()), fine: minData(fineMese(anno, oggi.getUTCMonth()), oggi) };
  }
  if (periodo === "semestre") {
    const semestre = oggi.getUTCMonth() < 6 ? 1 : 2;
    return { inizio: inizioSemestre(anno, semestre), fine: minData(fineSemestre(anno, semestre), oggi) };
  }
  if (periodo === "anno") {
    return { inizio: inizioAnno(anno), fine: minData(fineAnno(anno), oggi) };
  }
  const inizio = new Date(oggi);
  inizio.setUTCDate(inizio.getUTCDate() - 13);
  return { inizio, fine: oggi };
}

function minData(a: Date, b: Date) {
  return a.getTime() < b.getTime() ? a : b;
}

function serieMetrica(righe: KpiRiga[], periodo: Periodo, metrica: KpiMetricaKey, oggi: Date) {
  if (periodo === "settimana") return serieUltimiGiorni(righe, 7, metrica, oggi);
  if (periodo === "giorni") return serieUltimiGiorni(righe, 14, metrica, oggi);
  const { inizio, fine } = intervalloPeriodo(periodo, oggi);
  return serieGiornalieraIntervallo(righe, inizio, fine, metrica);
}

function titoloPeriodo(periodo: Periodo, anno: number) {
  if (periodo === "settimana") return "Ultimi 7 giorni";
  if (periodo === "mese") return `Giorno per giorno — mese corrente ${anno}`;
  if (periodo === "semestre") return `Giorno per giorno — semestre corrente ${anno}`;
  if (periodo === "anno") return `Giorno per giorno — anno ${anno}`;
  return "Ultimi 14 giorni";
}

export default async function KpiPage({ searchParams }: { searchParams: Promise<{ data?: string; periodo?: string }> }) {
  const { studio } = await requireActiveSubscription("kpi");
  const params = await searchParams;

  const oggi = new Date();
  const dataSelezionata = params.data ? new Date(params.data) : oggi;
  const isModifica = Boolean(params.data);
  const periodo: Periodo = PERIODI.some((p) => p.value === params.periodo) ? (params.periodo as Periodo) : PERIODO_DEFAULT;
  const anno = oggi.getUTCFullYear();

  const [righe, righeGiornoSelezionato] = await Promise.all([
    prisma.kpiGiornaliero.findMany({ where: { studioId: studio.id }, orderBy: { data: "desc" } }),
    prisma.kpiGiornaliero.findFirst({ where: { studioId: studio.id, data: dataSelezionata } }),
  ]);

  const serieVisibili = KPI_METRICHE.map((m) => ({
    ...m,
    serie: serieMetrica(righe, periodo, m.key, oggi),
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
        <UnsavedChangesGuard>
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
        </UnsavedChangesGuard>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {PERIODI.map((p) => (
          <Link
            key={p.value}
            href={`/app/kpi?periodo=${p.value}`}
            scroll={false}
            className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium ${
              periodo === p.value ? "bg-brand-600 text-white" : "border border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {serieVisibili.map((m) => {
          const totale = m.serie.reduce((s, x) => s + x.value, 0);
          const formatValue = m.isCurrency ? formatCurrency : (v: number) => String(v);
          return (
            <div key={m.key} className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="text-sm font-semibold text-slate-900">{m.label}</h2>
                <div className="text-right">
                  <p className="text-2xl font-bold tabular-nums text-slate-900">{formatValue(totale)}</p>
                  <p className="text-xs text-slate-500">{titoloPeriodo(periodo, anno)}</p>
                </div>
              </div>
              <TrendBars items={m.serie} formatValue={formatValue} barAreaHeight={72} />
            </div>
          );
        })}

        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-slate-900">Tasso di conversione</h2>
          <p className="mb-4 text-xs text-slate-500">{titoloPeriodo(periodo, anno)}</p>
          <p className="text-3xl font-bold text-slate-900">{conversionePeriodo === null ? "—" : `${conversionePeriodo}%`}</p>
          <p className="mt-2 text-xs text-slate-500">Preventivi accettati sul totale presentato nel periodo selezionato.</p>
        </div>
      </div>

      <TableScroll className="rounded-xl border border-slate-200 bg-white shadow-sm">
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
      </TableScroll>
    </div>
  );
}
