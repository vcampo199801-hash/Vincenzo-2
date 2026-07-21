import Link from "next/link";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { ecmPercent } from "@/lib/compliance";
import { PageHeader } from "@/components/ui/page-header";
import { DeleteButton } from "@/components/ui/delete-button";
import { deleteEcm } from "@/lib/actions/ecm";
import { StatusDonut } from "@/components/charts/donut";
import { BarList } from "@/components/charts/bar-list";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

const ECM_BUCKET_HEX = { completo: "#10b981", inCorso: "#5a9da5", daRecuperare: "#f59e0b" };

export default async function EcmPage() {
  const { studio } = await requireActiveSubscription("ecm");
  const crediti = await prisma.ecmCredito.findMany({ where: { studioId: studio.id }, orderBy: { professionista: "asc" } });

  const conPercentuale = crediti.map((e) => ({ ...e, ...ecmPercent(e.crediti2026, e.crediti2027, e.crediti2028, e.target) }));
  const completo = conPercentuale.filter((e) => e.percentuale >= 1).length;
  const inCorso = conPercentuale.filter((e) => e.percentuale >= 0.6 && e.percentuale < 1).length;
  const daRecuperare = conPercentuale.filter((e) => e.percentuale < 0.6).length;
  const rankedPerTotale = [...conPercentuale]
    .sort((a, b) => b.totale - a.totale)
    .map((e) => ({ label: e.professionista, value: e.totale }));

  return (
    <div>
      <PageHeader
        title="Formazione ECM del team"
        description="Traccia i crediti ECM di ogni professionista rispetto al target del triennio."
        action="Aggiungi professionista"
        actionHref="/app/ecm/new"
      />

      {crediti.length > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Team per stato di completamento</h2>
            <StatusDonut
              size={120}
              strokeWidth={16}
              centerValue={String(crediti.length)}
              centerLabel="professionisti"
              segments={[
                { label: "Completo (100%+)", value: completo, color: ECM_BUCKET_HEX.completo },
                { label: "In corso (60-99%)", value: inCorso, color: ECM_BUCKET_HEX.inCorso },
                { label: "Da recuperare (<60%)", value: daRecuperare, color: ECM_BUCKET_HEX.daRecuperare },
              ]}
            />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Crediti totali per professionista</h2>
            <BarList items={rankedPerTotale} formatValue={(v) => `${v} cr.`} />
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Professionista</th>
              <th className="px-4 py-3">Anno 1</th>
              <th className="px-4 py-3">Anno 2</th>
              <th className="px-4 py-3">Anno 3</th>
              <th className="px-4 py-3">Totale</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Mancanti</th>
              <th className="px-4 py-3 w-40">Completamento</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {conPercentuale.map((e) => {
              const { totale, mancanti, percentuale } = e;
              return (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{e.professionista}</td>
                  <td className="px-4 py-3 text-slate-600">{e.crediti2026}</td>
                  <td className="px-4 py-3 text-slate-600">{e.crediti2027}</td>
                  <td className="px-4 py-3 text-slate-600">{e.crediti2028}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{totale}</td>
                  <td className="px-4 py-3 text-slate-600">{e.target}</td>
                  <td className="px-4 py-3 text-slate-600">{mancanti}</td>
                  <td className="px-4 py-3">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${percentuale >= 1 ? "bg-emerald-500" : percentuale >= 0.6 ? "bg-brand-500" : "bg-amber-500"}`}
                        style={{ width: `${Math.round(percentuale * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">{Math.round(percentuale * 100)}%</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/app/ecm/${e.id}/edit`} className="text-sm font-medium text-brand-600 hover:text-brand-800">
                        Modifica
                      </Link>
                      <DeleteButton action={deleteEcm.bind(null, e.id)} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {crediti.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                  Nessun professionista censito.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
