import { notFound } from "next/navigation";
import Link from "next/link";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { deleteLavorazione, deleteAllegatoLavorazione } from "@/lib/actions/laboratori";
import {
  optionLabel,
  consegnaStato,
  isLaboratoriStorageConfigured,
  STATO_LAVORAZIONE_OPTIONS,
  TIPOLOGIA_LAVORAZIONE_OPTIONS,
  CATEGORIA_ALLEGATO_LAVORAZIONE_OPTIONS,
  CATEGORIA_DICHIARAZIONE_CONFORMITA,
} from "@/lib/laboratori";
import { formatDate, formatCurrency } from "@/lib/compliance";
import { StatoBadge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/ui/delete-button";
import { DichiarazioneConformitaForm } from "@/components/app/dichiarazione-conformita-form";
import { AllegatoLavorazioneForm } from "@/components/app/allegato-lavorazione-form";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

const RETENTION_WARNING =
  "I dispositivi su misura e le loro dichiarazioni di conformità vanno conservati per almeno 10 anni. Confermi comunque l'eliminazione di questa lavorazione?";

export default async function LavorazionePage({ params }: { params: Promise<{ id: string }> }) {
  const { studio } = await requireActiveSubscription("laboratori");
  const { id } = await params;

  const lavorazione = await prisma.lavorazione.findFirst({
    where: { id, studioId: studio.id },
    include: { laboratorio: true, allegati: true },
  });
  if (!lavorazione) notFound();

  const dichiarazione = lavorazione.allegati.find((a) => a.categoria === CATEGORIA_DICHIARAZIONE_CONFORMITA);
  const altriAllegati = lavorazione.allegati.filter((a) => a.categoria !== CATEGORIA_DICHIARAZIONE_CONFORMITA);
  const { stato: statoConsegna } = consegnaStato(lavorazione.dataConsegnaPrevista, lavorazione.dataConsegnaEffettiva);
  const storageConfigured = isLaboratoriStorageConfigured();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">{lavorazione.riferimentoPaziente}</h1>
            {statoConsegna !== "OK" && <StatoBadge stato={statoConsegna} />}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            <Link href={`/app/laboratori/${lavorazione.laboratorioId}`} className="hover:text-brand-700">
              {lavorazione.laboratorio.ragioneSociale}
            </Link>{" "}
            · {optionLabel(TIPOLOGIA_LAVORAZIONE_OPTIONS, lavorazione.tipoLavorazione)}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/app/laboratori/lavorazioni"
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Torna al registro
          </Link>
          <DeleteButton action={deleteLavorazione.bind(null, lavorazione.id)} confirmMessage={RETENTION_WARNING} />
        </div>
      </div>

      <div className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Dettagli lavorazione</h2>
          <dl className="grid grid-cols-2 gap-6 text-sm sm:grid-cols-3">
            <Field2 label="Elementi dentali" value={lavorazione.elementiDentali} />
            <Field2 label="Stato" value={optionLabel(STATO_LAVORAZIONE_OPTIONS, lavorazione.stato)} />
            <Field2 label="Costo" value={lavorazione.costo ? formatCurrency(lavorazione.costo) : "—"} />
            <Field2 label="Data invio" value={formatDate(lavorazione.dataInvio)} />
            <Field2 label="Data consegna prevista" value={formatDate(lavorazione.dataConsegnaPrevista)} />
            <Field2 label="Data consegna effettiva" value={formatDate(lavorazione.dataConsegnaEffettiva)} />
            <Field2 label="Copia consegnata al paziente il" value={formatDate(lavorazione.dataConsegnaCopiaPaziente)} />
          </dl>
          {lavorazione.note && (
            <div className="mt-6 border-t border-slate-100 pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Note</p>
              <p className="mt-1 text-sm text-slate-700">{lavorazione.note}</p>
            </div>
          )}
          <p className="mt-4 text-xs text-slate-400">
            Per modificare rapidamente stato, date, costo o data di consegna della copia al paziente, usa il{" "}
            <Link href={`/app/laboratori/lavorazioni?evidenzia=${lavorazione.id}`} className="underline hover:text-slate-600">
              Registro lavorazioni
            </Link>
            : le celle sono modificabili direttamente e si salvano da sole.
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Dichiarazione di conformità</h2>
          <p className="mb-4 mt-1 text-sm text-slate-500">
            Rilasciata dal laboratorio (fabbricante del dispositivo su misura) — Allegato XIII, Reg. UE 2017/745. Lo
            studio deve conservarla e consegnarne copia al paziente.
          </p>
          {dichiarazione ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
              <a href={`/api/laboratori/file/${dichiarazione.id}`} target="_blank" rel="noopener noreferrer" className="font-medium text-emerald-800 hover:text-emerald-950">
                📄 {dichiarazione.nomeFile}
              </a>
              <div className="flex items-center gap-3">
                <span className="text-xs text-emerald-700">Caricata il {formatDate(dichiarazione.dataCaricamento)}</span>
                <DeleteButton action={deleteAllegatoLavorazione.bind(null, dichiarazione.id, lavorazione.id)} confirmMessage={RETENTION_WARNING} />
              </div>
            </div>
          ) : (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
              Manca la dichiarazione di conformità per questa lavorazione.
            </p>
          )}
          <div className="mt-4">
            <DichiarazioneConformitaForm lavorazioneId={lavorazione.id} disabled={!storageConfigured} />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Allegati aggiuntivi</h2>
          <p className="mb-4 mt-1 text-sm text-slate-500">DDT, prescrizione, foto.</p>
          <div className="mb-4">
            <AllegatoLavorazioneForm lavorazioneId={lavorazione.id} disabled={!storageConfigured} />
          </div>
          <ul className="divide-y divide-slate-100">
            {altriAllegati.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <a href={`/api/laboratori/file/${a.id}`} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-600 hover:text-brand-800">
                  📎 {optionLabel(CATEGORIA_ALLEGATO_LAVORAZIONE_OPTIONS, a.categoria)} — {a.nomeFile}
                </a>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{formatDate(a.dataCaricamento)}</span>
                  <DeleteButton action={deleteAllegatoLavorazione.bind(null, a.id, lavorazione.id)} />
                </div>
              </li>
            ))}
            {altriAllegati.length === 0 && <p className="py-4 text-sm text-slate-500">Nessun allegato caricato.</p>}
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
