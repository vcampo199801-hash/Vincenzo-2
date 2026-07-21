import { notFound } from "next/navigation";
import Link from "next/link";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { deleteLaboratorio, deleteDocumentoLaboratorio } from "@/lib/actions/laboratori";
import {
  optionLabel,
  parseTipologie,
  calcolaIndicatoriLaboratorio,
  consegnaStato,
  isLaboratoriStorageConfigured,
  STATO_LABORATORIO_OPTIONS,
  STATO_LAVORAZIONE_OPTIONS,
  TIPOLOGIA_LAVORAZIONE_OPTIONS,
  CATEGORIA_DOCUMENTO_LABORATORIO_OPTIONS,
  CATEGORIA_DICHIARAZIONE_CONFORMITA,
} from "@/lib/laboratori";
import { formatDate, formatCurrency } from "@/lib/compliance";
import { StatoBadge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/ui/delete-button";
import { DocumentoLaboratorioForm } from "@/components/app/documento-laboratorio-form";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

const RETENTION_WARNING =
  "I dispositivi su misura e le loro dichiarazioni di conformità vanno conservati per almeno 10 anni. Eliminando il laboratorio elimini anche tutte le sue lavorazioni collegate. Confermi comunque?";

export default async function LaboratorioPage({ params }: { params: Promise<{ id: string }> }) {
  const { studio } = await requireActiveSubscription("laboratori");
  const { id } = await params;

  const laboratorio = await prisma.laboratorio.findFirst({
    where: { id, studioId: studio.id },
    include: {
      allegati: true,
      lavorazioni: { include: { allegati: true }, orderBy: { dataInvio: "desc" } },
    },
  });
  if (!laboratorio) notFound();

  const indicatori = calcolaIndicatoriLaboratorio(
    laboratorio.lavorazioni.map((l) => ({
      dataInvio: l.dataInvio,
      dataConsegnaPrevista: l.dataConsegnaPrevista,
      dataConsegnaEffettiva: l.dataConsegnaEffettiva,
      stato: l.stato,
      costo: l.costo,
      hasDichiarazione: l.allegati.some((a) => a.categoria === CATEGORIA_DICHIARAZIONE_CONFORMITA),
    }))
  );
  const tipologie = parseTipologie(laboratorio.tipologieLavorazione);
  const storageConfigured = isLaboratoriStorageConfigured();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{laboratorio.ragioneSociale}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {tipologie.length > 0 ? tipologie.map((t) => optionLabel(TIPOLOGIA_LAVORAZIONE_OPTIONS, t)).join(" · ") : "—"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/app/laboratori/${laboratorio.id}/edit`}
            className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
          >
            Modifica
          </Link>
          <DeleteButton action={deleteLaboratorio.bind(null, laboratorio.id)} confirmMessage={RETENTION_WARNING} />
        </div>
      </div>

      <div className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Anagrafica</h2>
          <dl className="grid grid-cols-2 gap-6 text-sm sm:grid-cols-3">
            <Field2 label="Partita IVA" value={laboratorio.partitaIva} />
            <Field2 label="Referente" value={laboratorio.referente} />
            <Field2 label="Telefono" value={laboratorio.telefono} />
            <Field2 label="Email" value={laboratorio.email} />
            <Field2 label="Indirizzo" value={laboratorio.indirizzo} />
            <Field2 label="Stato" value={optionLabel(STATO_LABORATORIO_OPTIONS, laboratorio.stato)} />
            <Field2 label="N. registrazione Ministero della Salute" value={laboratorio.numeroRegistrazioneMinisteriale} />
            <Field2 label="Ultima verifica registrazione" value={formatDate(laboratorio.dataUltimaVerificaRegistrazione)} />
          </dl>
          {laboratorio.note && (
            <div className="mt-6 border-t border-slate-100 pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Note</p>
              <p className="mt-1 text-sm text-slate-700">{laboratorio.note}</p>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Indicatori</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs text-slate-500">Lavori nell&apos;anno</dt>
              <dd className="text-lg font-semibold text-slate-900">{indicatori.lavoriAnno}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Spesa nell&apos;anno</dt>
              <dd className="text-lg font-semibold text-slate-900">{formatCurrency(indicatori.spesaAnno)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Consegne puntuali</dt>
              <dd className="text-lg font-semibold text-slate-900">
                {indicatori.percentualeConsegnePuntuali === null ? "—" : `${indicatori.percentualeConsegnePuntuali}%`}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Con dichiarazione di conformità</dt>
              <dd className={`text-lg font-semibold ${indicatori.percentualeDichiarazioni !== null && indicatori.percentualeDichiarazioni < 100 ? "text-red-600" : "text-slate-900"}`}>
                {indicatori.percentualeDichiarazioni === null ? "—" : `${indicatori.percentualeDichiarazioni}%`}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Documenti</h2>
          <p className="mb-4 mt-1 text-sm text-slate-500">Visura, autorizzazione sanitaria, certificazioni del laboratorio.</p>
          <div className="mb-4">
            <DocumentoLaboratorioForm laboratorioId={laboratorio.id} disabled={!storageConfigured} />
          </div>
          <ul className="divide-y divide-slate-100">
            {laboratorio.allegati.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <a href={`/api/laboratori/file/${a.id}`} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-600 hover:text-brand-800">
                  📎 {optionLabel(CATEGORIA_DOCUMENTO_LABORATORIO_OPTIONS, a.categoria)} — {a.nomeFile}
                </a>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{formatDate(a.dataCaricamento)}</span>
                  <DeleteButton action={deleteDocumentoLaboratorio.bind(null, a.id, laboratorio.id)} />
                </div>
              </li>
            ))}
            {laboratorio.allegati.length === 0 && <p className="py-4 text-sm text-slate-500">Nessun documento caricato.</p>}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Lavorazioni</h2>
            <Link href={`/app/laboratori/lavorazioni/new?laboratorioId=${laboratorio.id}`} className="text-sm font-medium text-brand-600 hover:text-brand-800">
              + Nuova lavorazione
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {laboratorio.lavorazioni.map((l) => {
              const { stato: statoConsegna } = consegnaStato(l.dataConsegnaPrevista, l.dataConsegnaEffettiva);
              return (
                <li key={l.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <Link href={`/app/laboratori/lavorazioni/${l.id}`} className="min-w-0 font-medium text-slate-800 hover:text-brand-700">
                    <span className="truncate">{l.riferimentoPaziente}</span>
                    <span className="ml-2 text-xs text-slate-500">
                      {optionLabel(TIPOLOGIA_LAVORAZIONE_OPTIONS, l.tipoLavorazione)} · inviato il {formatDate(l.dataInvio)}
                    </span>
                  </Link>
                  <div className="flex shrink-0 items-center gap-2">
                    {statoConsegna !== "OK" && <StatoBadge stato={statoConsegna} />}
                    <span className="text-xs text-slate-500">{optionLabel(STATO_LAVORAZIONE_OPTIONS, l.stato)}</span>
                  </div>
                </li>
              );
            })}
            {laboratorio.lavorazioni.length === 0 && <p className="py-4 text-sm text-slate-500">Nessuna lavorazione registrata.</p>}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Field2({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-900">{value || "—"}</dd>
    </div>
  );
}
