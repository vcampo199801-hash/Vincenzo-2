import Link from "next/link";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { DeleteButton } from "@/components/ui/delete-button";
import { deleteDocumento } from "@/lib/actions/documenti";
import { DocumentoStatoSelect } from "@/components/app/documento-stato-select";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function DocumentiPage() {
  const { studio } = await requireActiveSubscription("documenti");
  const documenti = await prisma.documento.findMany({ where: { studioId: studio.id }, orderBy: { ordine: "asc" } });

  const presenti = documenti.filter((d) => d.stato === "PRESENTE").length;
  const daAggiornare = documenti.filter((d) => d.stato === "DA_AGGIORNARE").length;
  const mancanti = documenti.filter((d) => d.stato === "MANCANTE").length;
  const completezza = documenti.length > 0 ? Math.round((presenti / documenti.length) * 100) : 0;

  return (
    <div>
      <PageHeader
        title="Checklist documenti dello studio"
        description="Cosa deve essere presente e aggiornato in studio."
        action="Aggiungi documento"
        actionHref="/app/documenti/new"
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Completezza archivio" value={`${completezza}%`} tone={completezza >= 80 ? "good" : completezza >= 40 ? "warn" : "bad"} />
        <StatCard label="Presenti" value={presenti} tone="good" />
        <StatCard label="Da aggiornare" value={daAggiornare} tone="warn" />
        <StatCard label="Mancanti" value={mancanti} tone="bad" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Documento</th>
              <th className="px-4 py-3">Stato</th>
              <th className="px-4 py-3">Note / dove si trova</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documenti.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{d.nome}</td>
                <td className="px-4 py-3">
                  <DocumentoStatoSelect id={d.id} stato={d.stato} />
                </td>
                <td className="px-4 py-3 max-w-md truncate text-slate-500">{d.note ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/app/documenti/${d.id}/edit`} className="text-sm font-medium text-brand-600 hover:text-brand-800">
                      Modifica
                    </Link>
                    <DeleteButton action={deleteDocumento.bind(null, d.id)} />
                  </div>
                </td>
              </tr>
            ))}
            {documenti.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  Nessun documento censito.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
