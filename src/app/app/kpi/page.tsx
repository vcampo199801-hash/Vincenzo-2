import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/compliance";
import { fatturatoPerGiorno, riepilogoPerMese, sommaKpi, tassoConversionePreventivi, MESI_LABELS } from "@/lib/kpi";
import { salvaKpiGiorno, deleteKpiGiorno } from "@/lib/actions/kpi";
import { PageHeader } from "@/components/ui/page-header";
import { Field, TextAreaField, SubmitButton } from "@/components/ui/form";
import { DeleteButton } from "@/components/ui/delete-button";
import { TrendBars } from "@/components/charts/trend-bars";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function KpiPage({ searchParams }: { searchParams: Promise<{ data?: string }> }) {
  const { studio } = await requireActiveSubscription("kpi");
  const params = await searchParams;

  const oggi = new Date();
  const dataSelezionata = params.data ? new Date(params.data) : oggi;
  const isModifica = Boolean(params.data);

  const [righeGrezze, righeGiornoSelezionato] = await Promise.all([
    prisma.kpiGiornaliero.findMany({ where: { studioId: studio.id }, orderBy: { data: "desc" } }),
    prisma.kpiGiornaliero.findFirst({ where: { studioId: studio.id, data: dataSelezionata } }),
  ]);

  const righe = righeGrezze;
  const anno = oggi.getFullYear();
  const mese = oggi.getMonth();

  const perGiornoMese = fatturatoPerGiorno(righe, anno, mese);
  const totaleMese = sommaKpi(righe.filter((r) => r.data.getFullYear() === anno && r.data.getMonth() === mese));
  const conversioneMese = tassoConversionePreventivi(totaleMese.valorePreventiviPresentati, totaleMese.valorePreventiviAccettati);

  const perMeseAnno = riepilogoPerMese(righe, anno);
  const totaleAnno = sommaKpi(righe.filter((r) => r.data.getFullYear() === anno));
  const conversioneAnno = tassoConversionePreventivi(totaleAnno.valorePreventiviPresentati, totaleAnno.valorePreventiviAccettati);

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

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-slate-900">Fatturato giornaliero — {MESI_LABELS[mese]} {anno}</h2>
          <p className="mb-4 text-xs text-slate-500">Totale mese: {formatCurrency(totaleMese.fatturato)}</p>
          <TrendBars items={perGiornoMese} formatValue={formatCurrency} />
          <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs text-slate-500">Prime visite</dt>
              <dd className="font-medium text-slate-900">{totaleMese.numeroPrimeVisite}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Appuntamenti</dt>
              <dd className="font-medium text-slate-900">{totaleMese.numeroAppuntamenti}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Preventivi presentati</dt>
              <dd className="font-medium text-slate-900">{formatCurrency(totaleMese.valorePreventiviPresentati)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Tasso di conversione</dt>
              <dd className="font-medium text-slate-900">{conversioneMese === null ? "—" : `${conversioneMese}%`}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-slate-900">Fatturato mensile — anno {anno}</h2>
          <p className="mb-4 text-xs text-slate-500">Totale anno: {formatCurrency(totaleAnno.fatturato)}</p>
          <TrendBars items={perMeseAnno.map((m) => ({ label: m.label, value: m.fatturato }))} formatValue={formatCurrency} />
          <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs text-slate-500">Prime visite</dt>
              <dd className="font-medium text-slate-900">{totaleAnno.numeroPrimeVisite}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Appuntamenti</dt>
              <dd className="font-medium text-slate-900">{totaleAnno.numeroAppuntamenti}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Preventivi presentati</dt>
              <dd className="font-medium text-slate-900">{formatCurrency(totaleAnno.valorePreventiviPresentati)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Tasso di conversione</dt>
              <dd className="font-medium text-slate-900">{conversioneAnno === null ? "—" : `${conversioneAnno}%`}</dd>
            </div>
          </dl>
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
