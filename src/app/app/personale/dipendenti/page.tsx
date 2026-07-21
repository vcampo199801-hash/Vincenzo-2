import Link from "next/link";
import { requirePersonaleAccess } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { logPersonaleAccess } from "@/lib/personale-access-log";
import { scadenzaPersonaleStato, peggiore, optionLabel, MANSIONE_OPTIONS, STATO_DIPENDENTE_OPTIONS } from "@/lib/personale";
import { formatDate } from "@/lib/compliance";
import { PageHeader } from "@/components/ui/page-header";
import { StatoBadge } from "@/components/ui/badge";
import { ImportDipendentiCsvForm } from "@/components/app/import-dipendenti-csv-form";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function DipendentiPage() {
  const { studio, session } = await requirePersonaleAccess();

  const dipendenti = await prisma.dipendente.findMany({
    where: { studioId: studio.id },
    include: { adempimentiPersonale: true },
    orderBy: [{ stato: "asc" }, { cognome: "asc" }, { nome: "asc" }],
  });

  await logPersonaleAccess({ studioId: studio.id, userId: session.userId, azione: "VIEW_LISTA" });

  const rows = dipendenti.map((d) => {
    const stati = d.adempimentiPersonale.map((a) => scadenzaPersonaleStato(a.dataScadenza).stato);
    return { d, complessivo: peggiore(stati) };
  });

  return (
    <div>
      <PageHeader
        title="Dipendenti"
        description="Anagrafica, contratto e stato di compliance di ogni collaboratore dello studio."
        action="Nuovo dipendente"
        actionHref="/app/personale/dipendenti/new"
      />

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-medium text-slate-700">Import / export CSV (per allinearsi col consulente del lavoro)</p>
        <div className="flex flex-wrap items-center gap-4">
          <ImportDipendentiCsvForm />
          <a href="/api/personale/export" className="text-sm font-medium text-brand-600 hover:text-brand-800">
            ⬇ Esporta CSV
          </a>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Mansione</th>
              <th className="px-4 py-3">Contratto</th>
              <th className="px-4 py-3">Assunzione</th>
              <th className="px-4 py-3">Stato</th>
              <th className="px-4 py-3">Compliance</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ d, complessivo }) => (
              <tr key={d.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">
                  <Link href={`/app/personale/dipendenti/${d.id}`} className="hover:text-brand-700">
                    {d.nome} {d.cognome}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{optionLabel(MANSIONE_OPTIONS, d.mansione)}</td>
                <td className="px-4 py-3 text-slate-600">{d.tipoContratto}</td>
                <td className="px-4 py-3 text-slate-600">{formatDate(d.dataAssunzione)}</td>
                <td className="px-4 py-3 text-slate-600">{optionLabel(STATO_DIPENDENTE_OPTIONS, d.stato)}</td>
                <td className="px-4 py-3">
                  {d.adempimentiPersonale.length > 0 ? <StatoBadge stato={complessivo} /> : <span className="text-xs text-slate-400">—</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/app/personale/dipendenti/${d.id}`} className="text-sm font-medium text-brand-600 hover:text-brand-800">
                    Apri
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Nessun dipendente censito.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
