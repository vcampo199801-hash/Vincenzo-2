import { notFound } from "next/navigation";
import { requirePersonaleAccess } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { logPersonaleAccess } from "@/lib/personale-access-log";
import { scadenzaPersonaleStato, optionLabel, MANSIONE_OPTIONS, TIPO_CONTRATTO_OPTIONS, STATO_DIPENDENTE_OPTIONS, TIPOLOGIA_ADEMPIMENTO_OPTIONS } from "@/lib/personale";
import { formatDate, STATO_LABELS } from "@/lib/compliance";
import { PrintButton } from "@/components/app/print-button";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function FascicoloDipendentePage({ params }: { params: Promise<{ id: string }> }) {
  const { studio, session } = await requirePersonaleAccess();
  const { id } = await params;

  const dipendente = await prisma.dipendente.findFirst({
    where: { id, studioId: studio.id },
    include: {
      adempimentiPersonale: { orderBy: { dataScadenza: "asc" }, include: { fileAllegato: true } },
    },
  });
  if (!dipendente) notFound();

  await logPersonaleAccess({ studioId: studio.id, userId: session.userId, dipendenteId: id, azione: "EXPORT_PDF" });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="no-print mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Fascicolo dipendente</h1>
          <p className="mt-1 text-sm text-slate-500">
            {dipendente.nome} {dipendente.cognome} — pronto da esibire in caso di ispezione ASL/Ispettorato del Lavoro.
          </p>
        </div>
        <PrintButton />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm print:border-0 print:shadow-none print:p-0 sm:p-8">
        <div className="mb-6 border-b border-slate-200 pb-4">
          <p className="text-lg font-semibold text-slate-900">
            {dipendente.nome} {dipendente.cognome}
          </p>
          <p className="text-sm text-slate-500">
            {studio.name} · Fascicolo generato il {formatDate(new Date())}
          </p>
        </div>

        <section className="mb-8">
          <h2 className="mb-3 text-base font-semibold text-slate-900">Anagrafica e contratto</h2>
          <table className="w-full border-collapse text-sm">
            <tbody>
              <FascicoloRow label="Codice fiscale" value={dipendente.codiceFiscale} />
              <FascicoloRow label="Data di nascita" value={formatDate(dipendente.dataNascita)} />
              <FascicoloRow label="Mansione" value={optionLabel(MANSIONE_OPTIONS, dipendente.mansione)} />
              <FascicoloRow label="Tipo contratto" value={optionLabel(TIPO_CONTRATTO_OPTIONS, dipendente.tipoContratto)} />
              <FascicoloRow label="CCNL / Livello" value={[dipendente.ccnl, dipendente.livello].filter(Boolean).join(" · ")} />
              <FascicoloRow label="Data assunzione" value={formatDate(dipendente.dataAssunzione)} />
              <FascicoloRow label="Data fine contratto" value={formatDate(dipendente.dataFineContratto)} />
              <FascicoloRow label="Ore settimanali" value={dipendente.oreSettimanali} />
              <FascicoloRow label="Fine periodo di prova" value={formatDate(dipendente.finePeriodoProva)} />
              <FascicoloRow label="Stato" value={optionLabel(STATO_DIPENDENTE_OPTIONS, dipendente.stato)} />
            </tbody>
          </table>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-base font-semibold text-slate-900">
            Storico adempimenti ({dipendente.adempimentiPersonale.length})
          </h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-300 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-3">Tipologia</th>
                <th className="py-2 pr-3">Eseguito il</th>
                <th className="py-2 pr-3">Scadenza</th>
                <th className="py-2 pr-3">Esito</th>
                <th className="py-2 pr-3">Stato</th>
                <th className="py-2 pr-3">Allegato</th>
              </tr>
            </thead>
            <tbody>
              {dipendente.adempimentiPersonale.map((a) => {
                const { stato } = scadenzaPersonaleStato(a.dataScadenza);
                return (
                  <tr key={a.id} className="border-b border-slate-100">
                    <td className="py-2 pr-3 text-slate-700">{optionLabel(TIPOLOGIA_ADEMPIMENTO_OPTIONS, a.tipologia)}</td>
                    <td className="py-2 pr-3 text-slate-700">{formatDate(a.dataEsecuzione)}</td>
                    <td className="py-2 pr-3 text-slate-700">{formatDate(a.dataScadenza)}</td>
                    <td className="py-2 pr-3 text-slate-700">{a.esito ?? "—"}</td>
                    <td className="py-2 pr-3 text-slate-700">{STATO_LABELS[stato] ?? stato}</td>
                    <td className="py-2 pr-3 text-slate-700">{a.fileAllegato ? a.fileAllegato.nomeFile : "—"}</td>
                  </tr>
                );
              })}
              {dipendente.adempimentiPersonale.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-400">
                    Nessun adempimento registrato.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <p className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-400">
          Documento generato automaticamente da Scadenze in Regola — Gestione Personale. È un supporto organizzativo:
          non sostituisce le scritture e gli obblighi del consulente del lavoro, né i dati ufficiali di libro unico e
          cedolini paga.
        </p>
      </div>
    </div>
  );
}

function FascicoloRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <tr className="border-b border-slate-100">
      <td className="py-2 pr-4 text-xs font-medium uppercase tracking-wide text-slate-500">{label}</td>
      <td className="py-2 text-slate-700">{value || "—"}</td>
    </tr>
  );
}
