import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/compliance";
import { MODULO_TEMPLATES } from "@/lib/modulistica-templates";
import { STATO_MODULO_OPTIONS, optionLabel } from "@/lib/modulistica";
import { deletePaziente, deleteModuloCompilato, inviaModuloViaEmail } from "@/lib/actions/modulistica";
import { PageHeader } from "@/components/ui/page-header";
import { DeleteButton } from "@/components/ui/delete-button";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

const ERRORE_LABEL: Record<string, string> = {
  "email-non-configurata": "L'invio email non è ancora configurato su questa istanza.",
  "modulo-non-trovato": "Modulo non trovato.",
  "email-paziente-mancante": "Questo paziente non ha un indirizzo email registrato.",
  "download-fallito": "Impossibile recuperare il PDF dallo storage.",
  "invio-fallito": "Invio dell'email non riuscito. Riprova.",
};

export default async function SchedaPazientePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ errore?: string; inviato?: string }>;
}) {
  const { studio } = await requireActiveSubscription("modulistica");
  const { id } = await params;
  const query = await searchParams;
  const paziente = await prisma.paziente.findFirst({
    where: { id, studioId: studio.id },
    include: { moduliCompilati: { orderBy: { createdAt: "desc" } } },
  });
  if (!paziente) notFound();

  return (
    <div>
      <PageHeader
        title={`${paziente.cognome} ${paziente.nome}`}
        description="Dati identificativi e moduli compilati per questo paziente."
      />

      {query.inviato && (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Documento inviato via email al paziente.
        </p>
      )}
      {query.errore && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {ERRORE_LABEL[query.errore] ?? "Si è verificato un errore."}
        </p>
      )}

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Dati anagrafici</h2>
            <Link href={`/app/modulistica/pazienti/${paziente.id}/edit`} className="text-sm font-medium text-brand-600 hover:text-brand-800">
              Modifica
            </Link>
          </div>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-xs text-slate-500">Nato/a a, il</dt>
              <dd className="text-slate-900">{paziente.luogoNascita || "—"}, {formatDate(paziente.dataNascita)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Residenza</dt>
              <dd className="text-slate-900">{paziente.residenza || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Codice Fiscale</dt>
              <dd className="text-slate-900">{paziente.codiceFiscale || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Telefono / Email</dt>
              <dd className="text-slate-900">{[paziente.telefono, paziente.email].filter(Boolean).join(" · ") || "—"}</dd>
            </div>
            {paziente.medicoCurante && (
              <div>
                <dt className="text-xs text-slate-500">Medico curante</dt>
                <dd className="text-slate-900">{paziente.medicoCurante}</dd>
              </div>
            )}
            {paziente.note && (
              <div>
                <dt className="text-xs text-slate-500">Note</dt>
                <dd className="text-slate-900">{paziente.note}</dd>
              </div>
            )}
          </dl>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <DeleteButton
              action={deletePaziente.bind(null, paziente.id)}
              confirmMessage={`Eliminare ${paziente.cognome} ${paziente.nome} e tutti i ${paziente.moduliCompilati.length} moduli compilati? L'operazione non è reversibile.`}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Compila un nuovo modulo</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {MODULO_TEMPLATES.map((t) => (
              <Link
                key={t.key}
                href={`/app/modulistica/pazienti/${paziente.id}/compila/${t.key}`}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700"
              >
                {t.numero}. {t.titolo}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Modulo</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Stato</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paziente.moduliCompilati.map((m) => {
              const template = MODULO_TEMPLATES.find((t) => t.key === m.templateKey);
              return (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{template?.titolo ?? m.templateKey}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(m.data)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      {optionLabel(STATO_MODULO_OPTIONS, m.stato)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {m.pdfFileUrl && (
                        <a
                          href={`/api/modulistica/file/${m.id}?campo=pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-brand-600 hover:text-brand-800"
                        >
                          Apri PDF
                        </a>
                      )}
                      {m.pdfFileUrl && paziente.email && (
                        <form action={inviaModuloViaEmail.bind(null, m.id, paziente.id)}>
                          <button type="submit" className="text-sm font-medium text-brand-600 hover:text-brand-800">
                            Invia via email
                          </button>
                        </form>
                      )}
                      <DeleteButton
                        action={deleteModuloCompilato.bind(null, m.id, paziente.id)}
                        confirmMessage="Eliminare questo modulo firmato? La documentazione sanitaria va conservata per almeno 10 anni: elimina solo in caso di errore di compilazione."
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
            {paziente.moduliCompilati.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  Nessun modulo compilato finora per questo paziente.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
