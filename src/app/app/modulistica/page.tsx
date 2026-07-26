import Link from "next/link";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/compliance";
import { PageHeader } from "@/components/ui/page-header";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function ModulisticaPage() {
  const { studio } = await requireActiveSubscription("modulistica");

  const pazienti = await prisma.paziente.findMany({
    where: { studioId: studio.id },
    include: { moduliCompilati: { select: { id: true } }, _count: { select: { moduliCompilati: true } } },
    orderBy: [{ cognome: "asc" }, { nome: "asc" }],
  });

  return (
    <div>
      <PageHeader
        title="Modulistica"
        description="Anagrafica pazienti e consensi informati da compilare, firmare e archiviare."
        action="Nuovo paziente"
        actionHref="/app/modulistica/pazienti/new"
      />
      <p className="mb-6 max-w-3xl text-sm text-slate-500">
        Non è una cartella clinica: registra solo i dati identificativi necessari a compilare i moduli e conserva lo
        storico di quelli firmati per ogni paziente.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pazienti.map((p) => (
          <Link
            key={p.id}
            href={`/app/modulistica/pazienti/${p.id}`}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-brand-300"
          >
            <h2 className="font-semibold text-slate-900">
              {p.cognome} {p.nome}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {p.dataNascita ? `Nato/a il ${formatDate(p.dataNascita)}` : "Data di nascita non indicata"}
            </p>
            <p className="mt-3 text-sm text-slate-600">
              {p._count.moduliCompilati} modul{p._count.moduliCompilati === 1 ? "o" : "i"} compilat
              {p._count.moduliCompilati === 1 ? "o" : "i"}
            </p>
          </Link>
        ))}
      </div>

      {pazienti.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center shadow-sm">
          <p className="text-sm text-slate-500">Non hai ancora censito nessun paziente in Modulistica.</p>
          <Link
            href="/app/modulistica/pazienti/new"
            className="mt-3 inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
          >
            Aggiungi il primo paziente
          </Link>
        </div>
      )}
    </div>
  );
}
