import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { scadenzaStato } from "@/lib/compliance";
import { PageHeader } from "@/components/ui/page-header";
import { ScadenzarioRow } from "@/components/app/scadenzario-row";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function ScadenzarioPage() {
  const { studio } = await requireActiveSubscription();

  const adempimenti = await prisma.adempimento.findMany({
    where: { studioId: studio.id },
    orderBy: { ordine: "asc" },
  });

  const rows = adempimenti
    .map((a) => ({ a, ...scadenzaStato(a.dataUltimoControllo, a.mesi) }))
    .sort((x, y) => {
      const gx = x.giorni ?? Infinity;
      const gy = y.giorni ?? Infinity;
      return gx - gy;
    });

  const counts = rows.reduce(
    (acc, r) => {
      acc[r.stato] = (acc[r.stato] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div>
      <PageHeader
        title="Scadenzario compliance"
        description="Tieni traccia di tutte le scadenze normative dello studio."
        action="Nuovo adempimento"
        actionHref="/app/scadenzario/new"
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryPill label="In regola" value={counts.OK ?? 0} tone="good" />
        <SummaryPill label="In scadenza" value={counts.IN_SCADENZA ?? 0} tone="warn" />
        <SummaryPill label="Scaduti" value={counts.SCADUTO ?? 0} tone="bad" />
        <SummaryPill label="Da compilare" value={counts.DA_COMPILARE ?? 0} tone="default" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Adempimento</th>
              <th className="px-4 py-3">Periodicità</th>
              <th className="px-4 py-3">Ultimo controllo</th>
              <th className="px-4 py-3">Prossima scadenza</th>
              <th className="px-4 py-3">Giorni</th>
              <th className="px-4 py-3">Stato</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ a, prossimaScadenza, giorni, stato }) => (
              <ScadenzarioRow
                key={a.id}
                id={a.id}
                nome={a.nome}
                riferimento={a.riferimento}
                periodicita={a.periodicita}
                dataUltimoControllo={a.dataUltimoControllo}
                prossimaScadenza={prossimaScadenza}
                giorni={giorni}
                stato={stato}
              />
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Nessun adempimento censito.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryPill({ label, value, tone }: { label: string; value: number; tone: "good" | "warn" | "bad" | "default" }) {
  const colors: Record<string, string> = {
    good: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warn: "border-amber-200 bg-amber-50 text-amber-700",
    bad: "border-red-200 bg-red-50 text-red-700",
    default: "border-slate-200 bg-slate-50 text-slate-700",
  };
  return (
    <div className={`rounded-xl border p-3 text-center ${colors[tone]}`}>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs font-medium">{label}</p>
    </div>
  );
}
