import Link from "next/link";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { formatDate, formatCurrency } from "@/lib/compliance";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { DeleteButton } from "@/components/ui/delete-button";
import { deleteControllo } from "@/lib/actions/controlli";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function ControlliPage() {
  const { studio } = await requireActiveSubscription();

  const controlli = await prisma.controlloLog.findMany({
    where: { studioId: studio.id },
    orderBy: { dataIntervento: "desc" },
    include: { adempimento: true },
  });

  const currentYear = new Date().getFullYear();
  const thisYear = controlli.filter((c) => c.dataIntervento.getFullYear() === currentYear);
  const totaleSpesa = thisYear.reduce((sum, c) => sum + c.costo, 0);

  return (
    <div>
      <PageHeader
        title="Registro dei controlli e delle manutenzioni"
        description="Lo storico che dimostra la diligenza dello studio."
        action="Registra intervento"
        actionHref="/app/controlli/new"
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label={`Interventi ${currentYear}`} value={thisYear.length} />
        <StatCard label={`Spesa totale ${currentYear}`} value={formatCurrency(totaleSpesa)} />
        <StatCard label="Interventi totali" value={controlli.length} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Adempimento</th>
              <th className="px-4 py-3">Fornitore / Tecnico</th>
              <th className="px-4 py-3">Esito</th>
              <th className="px-4 py-3">Costo</th>
              <th className="px-4 py-3">Note</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {controlli.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-600">{formatDate(c.dataIntervento)}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{c.adempimento?.nome ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{c.tecnico ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{c.esito}</td>
                <td className="px-4 py-3 text-slate-600">{formatCurrency(c.costo)}</td>
                <td className="px-4 py-3 max-w-xs truncate text-slate-500">{c.note ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/app/controlli/${c.id}/edit`} className="text-sm font-medium text-brand-600 hover:text-brand-800">
                      Modifica
                    </Link>
                    <DeleteButton action={deleteControllo.bind(null, c.id)} />
                  </div>
                </td>
              </tr>
            ))}
            {controlli.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Nessun intervento registrato.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
