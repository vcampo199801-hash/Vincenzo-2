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

      <p className="mb-4 text-sm text-slate-500">
        Clicca su &quot;Nuovo dipendente&quot; per aggiungere un collaboratore (ASO, igienista, segretaria,
        odontoiatra collaboratore...). Servono solo nome e cognome per iniziare: gli altri dati (contratto, ferie,
        scadenze) si compilano quando vuoi, aprendo la scheda del dipendente. La colonna &quot;Compliance&quot; ti
        mostra a colpo d&apos;occhio se ci sono scadenze da tenere d&apos;occhio: verde tutto ok, giallo in
        avvicinamento, rosso scaduto o urgente.
      </p>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-1 text-sm font-medium text-slate-700">Import / export CSV</p>
        <p className="mb-3 text-xs text-slate-500">
          Utile se il tuo consulente del lavoro ti manda già un elenco dipendenti in Excel/CSV: importalo per non
          reinserire tutto a mano. L&apos;export ti serve per condividere i dati con lui in un formato che può
          riaprire.
        </p>
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
                <td colSpan={7} className="px-4 py-10 text-center">
                  <p className="text-sm text-slate-500">Non hai ancora aggiunto nessun collaboratore dello studio.</p>
                  <Link
                    href="/app/personale/dipendenti/new"
                    className="mt-3 inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
                  >
                    Aggiungi il primo dipendente
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
