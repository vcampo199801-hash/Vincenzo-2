import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/compliance";
import {
  TIPO_MANUTENZIONE_OPTIONS,
  ESITO_MANUTENZIONE_OPTIONS,
  optionLabel,
  ultimoControlloPerTipo,
  contaAnomalie,
} from "@/lib/manutenzione";
import { creaManutenzione, eliminaManutenzione } from "@/lib/actions/manutenzione";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Field, SelectField, TextAreaField, SubmitButton } from "@/components/ui/form";
import { DeleteButton } from "@/components/ui/delete-button";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

const ESITO_STYLE: Record<string, string> = {
  OK: "bg-emerald-100 text-emerald-700",
  ANOMALIA: "bg-red-100 text-red-700",
  DA_VERIFICARE: "bg-amber-100 text-amber-700",
};

export default async function ManutenzionePage() {
  const { studio } = await requireActiveSubscription("manutenzione");

  const registrazioni = await prisma.manutenzioneLog.findMany({ where: { studioId: studio.id }, orderBy: { data: "desc" } });
  const perTipo = ultimoControlloPerTipo(registrazioni);
  const anomalie = contaAnomalie(registrazioni);

  return (
    <div>
      <PageHeader
        title="Manutenzione staff"
        description="Controlli di routine eseguiti dal personale: autoclave, lubrificazione manipoli, pulizia aspiratori. Ogni voce riporta l'operatore che l'ha eseguita."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Controlli registrati" value={registrazioni.length} />
        <StatCard label="Anomalie riscontrate" value={anomalie} tone={anomalie > 0 ? "bad" : "good"} />
        <StatCard label="Tipi di controllo in ritardo" value={perTipo.filter((t) => t.inRitardo).length} tone={perTipo.some((t) => t.inRitardo) ? "warn" : "good"} />
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {perTipo.map((t) => (
          <div key={t.tipo} className={`rounded-xl border p-4 ${t.inRitardo ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"} shadow-sm`}>
            <p className="text-sm font-semibold text-slate-900">{t.label}</p>
            {t.ultima ? (
              <p className="mt-1 text-xs text-slate-500">
                Ultimo il {formatDate(t.ultima.data)} — {t.ultima.esito === "OK" ? "OK" : optionLabel(ESITO_MANUTENZIONE_OPTIONS, t.ultima.esito)}
                {t.inRitardo && <span className="ml-1 font-medium text-amber-700">· in ritardo</span>}
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">Nessuna registrazione ancora.</p>
            )}
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Registra un controllo</h2>
        <form action={creaManutenzione} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Tipo di controllo" name="tipo" options={TIPO_MANUTENZIONE_OPTIONS} defaultValue="AUTOCLAVE" required />
            <Field label="Data" name="data" type="date" required defaultValue={toIsoDate(new Date())} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Operatore (firma)" name="operatore" required placeholder="Nome di chi ha eseguito il controllo" hint="Obbligatorio: è l'attestazione di chi ha eseguito il controllo." />
            <SelectField label="Esito" name="esito" options={ESITO_MANUTENZIONE_OPTIONS} defaultValue="OK" required />
          </div>
          <TextAreaField label="Note" name="note" placeholder="Es. numero ciclo, lotto indicatore biologico, dettagli anomalia..." />
          <SubmitButton>Registra controllo</SubmitButton>
        </form>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Operatore</th>
              <th className="px-4 py-3">Esito</th>
              <th className="px-4 py-3">Note</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {registrazioni.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-600">{formatDate(r.data)}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{optionLabel(TIPO_MANUTENZIONE_OPTIONS, r.tipo)}</td>
                <td className="px-4 py-3 text-slate-600">{r.operatore}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ESITO_STYLE[r.esito] ?? "bg-slate-100 text-slate-600"}`}>
                    {optionLabel(ESITO_MANUTENZIONE_OPTIONS, r.esito)}
                  </span>
                </td>
                <td className="px-4 py-3 max-w-xs truncate text-slate-500">{r.note ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <DeleteButton action={eliminaManutenzione.bind(null, r.id)} />
                </td>
              </tr>
            ))}
            {registrazioni.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Nessun controllo registrato finora.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
