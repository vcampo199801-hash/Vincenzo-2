import Link from "next/link";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/compliance";
import { PageHeader } from "@/components/ui/page-header";
import { DeleteButton } from "@/components/ui/delete-button";
import { deleteFornitore } from "@/lib/actions/fornitori";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function FornitoriPage() {
  const { studio } = await requireActiveSubscription();
  const fornitori = await prisma.fornitore.findMany({ where: { studioId: studio.id }, orderBy: { ruolo: "asc" } });

  const compliance = fornitori.filter((f) => f.tipo === "COMPLIANCE");
  const materiali = fornitori.filter((f) => f.tipo === "MATERIALI");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Rubrica fornitori"
        description="I referenti compliance e i fornitori di materiali, tutti in un posto."
        action="Aggiungi fornitore"
        actionHref="/app/fornitori/new"
      />

      <FornitoriTable title="Referenti compliance" items={compliance} />
      <FornitoriTable title="Fornitori materiali di consumo" items={materiali} />
    </div>
  );
}

function FornitoriTable({ title, items }: { title: string; items: Awaited<ReturnType<typeof prisma.fornitore.findMany>> }) {
  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold text-slate-900">{title}</h2>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Ruolo</th>
              <th className="px-4 py-3">Nome / Ditta</th>
              <th className="px-4 py-3">Telefono</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Contratto</th>
              <th className="px-4 py-3">Scadenza</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((f) => (
              <tr key={f.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{f.ruolo}</td>
                <td className="px-4 py-3 text-slate-600">{f.nome ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{f.telefono ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{f.email ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{f.contrattoAttivo ? "Attivo" : "—"}</td>
                <td className="px-4 py-3 text-slate-600">{formatDate(f.scadenzaContratto)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/app/fornitori/${f.id}/edit`} className="text-sm font-medium text-brand-600 hover:text-brand-800">
                      Modifica
                    </Link>
                    <DeleteButton action={deleteFornitore.bind(null, f.id)} />
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                  Nessun fornitore in questa categoria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
