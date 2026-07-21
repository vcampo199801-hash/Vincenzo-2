import Link from "next/link";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { formatDate, formatCurrency } from "@/lib/compliance";
import { contrattoStato, optionLabel, MANSIONE_OPTIONS, TIPO_CONTRATTO_OPTIONS, STATO_DIPENDENTE_OPTIONS } from "@/lib/personale";
import { PageHeader } from "@/components/ui/page-header";
import { StatoBadge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/ui/delete-button";
import { deleteDipendente } from "@/lib/actions/personale";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function PersonalePage() {
  const { studio } = await requireActiveSubscription("personale");

  const dipendenti = await prisma.dipendente.findMany({
    where: { studioId: studio.id },
    orderBy: [{ stato: "asc" }, { cognome: "asc" }, { nome: "asc" }],
  });

  return (
    <div>
      <PageHeader
        title="Personale"
        description="Anagrafica, contratto e archivio cedolini dei collaboratori dello studio."
        action="Nuovo dipendente"
        actionHref="/app/personale/new"
      />
      <p className="mb-6 max-w-3xl text-sm text-slate-500">
        Questo modulo non è un gestionale HR: non calcola ferie, permessi, contributi o TFR. Registra solo i dati
        anagrafici e contrattuali e i valori economici che inserisci tu manualmente (dai prospetti del consulente
        del lavoro), e archivia i cedolini mese per mese.
      </p>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Mansione</th>
              <th className="px-4 py-3">Contratto</th>
              <th className="px-4 py-3">Assunzione</th>
              <th className="px-4 py-3">Scadenza contratto</th>
              <th className="px-4 py-3">Costo aziendale/mese</th>
              <th className="px-4 py-3">Stato</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dipendenti.map((d) => {
              const { stato } = contrattoStato(d.dataScadenzaContratto);
              return (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <Link href={`/app/personale/${d.id}`} className="hover:text-brand-700">
                      {d.nome} {d.cognome}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{optionLabel(MANSIONE_OPTIONS, d.mansione)}</td>
                  <td className="px-4 py-3 text-slate-600">{optionLabel(TIPO_CONTRATTO_OPTIONS, d.tipoContratto)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(d.dataAssunzione)}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {d.dataScadenzaContratto ? (
                      <span className="inline-flex items-center gap-2">
                        {formatDate(d.dataScadenzaContratto)}
                        <StatoBadge stato={stato} />
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {d.costoAziendaleMensile ? formatCurrency(d.costoAziendaleMensile) : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{optionLabel(STATO_DIPENDENTE_OPTIONS, d.stato)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/app/personale/${d.id}`} className="text-sm font-medium text-brand-600 hover:text-brand-800">
                        Apri
                      </Link>
                      <Link href={`/app/personale/${d.id}/edit`} className="text-sm font-medium text-brand-600 hover:text-brand-800">
                        Modifica
                      </Link>
                      <DeleteButton action={deleteDipendente.bind(null, d.id)} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {dipendenti.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center">
                  <p className="text-sm text-slate-500">Non hai ancora aggiunto nessun collaboratore dello studio.</p>
                  <Link
                    href="/app/personale/new"
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
