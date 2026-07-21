import { notFound } from "next/navigation";
import Link from "next/link";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { deleteCedolino } from "@/lib/actions/personale";
import {
  contrattoStato,
  optionLabel,
  isCedolinoStorageConfigured,
  MANSIONE_OPTIONS,
  TIPO_CONTRATTO_OPTIONS,
  STATO_DIPENDENTE_OPTIONS,
  MESI_LABELS_BREVI,
} from "@/lib/personale";
import { formatDate, formatCurrency } from "@/lib/compliance";
import { StatoBadge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/ui/delete-button";
import { CedolinoUploadForm } from "@/components/app/cedolino-upload-form";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function DipendentePage({ params }: { params: Promise<{ id: string }> }) {
  const { studio } = await requireActiveSubscription("personale");
  const { id } = await params;

  const dipendente = await prisma.dipendente.findFirst({
    where: { id, studioId: studio.id },
    include: { cedolini: { orderBy: [{ anno: "desc" }, { mese: "desc" }] } },
  });
  if (!dipendente) notFound();

  const { stato } = contrattoStato(dipendente.dataScadenzaContratto);
  const storageConfigured = isCedolinoStorageConfigured();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">
              {dipendente.nome} {dipendente.cognome}
            </h1>
            {dipendente.dataScadenzaContratto && <StatoBadge stato={stato} />}
          </div>
          <p className="mt-1 text-sm text-slate-500">{optionLabel(MANSIONE_OPTIONS, dipendente.mansione)}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/app/personale/${dipendente.id}/edit`}
            className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
          >
            Modifica anagrafica
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Anagrafica & Contratto</h2>
          <dl className="grid grid-cols-2 gap-6 text-sm sm:grid-cols-3">
            <Field2 label="Mansione" value={optionLabel(MANSIONE_OPTIONS, dipendente.mansione)} />
            <Field2 label="Tipo contratto" value={optionLabel(TIPO_CONTRATTO_OPTIONS, dipendente.tipoContratto)} />
            <Field2 label="Stato" value={optionLabel(STATO_DIPENDENTE_OPTIONS, dipendente.stato)} />
            <Field2 label="Data assunzione" value={formatDate(dipendente.dataAssunzione)} />
            <Field2 label="Scadenza contratto" value={formatDate(dipendente.dataScadenzaContratto)} />
            <Field2 label="Fine periodo di prova" value={formatDate(dipendente.finePeriodoProva)} />
            <Field2 label="Ore settimanali" value={dipendente.oreSettimanali ?? "—"} />
            <Field2 label="Stipendio lordo mensile" value={dipendente.stipendioLordoMensile ? formatCurrency(dipendente.stipendioLordoMensile) : "—"} />
            <Field2 label="Costo aziendale mensile" value={dipendente.costoAziendaleMensile ? formatCurrency(dipendente.costoAziendaleMensile) : "—"} />
          </dl>
          {dipendente.note && (
            <div className="mt-6 border-t border-slate-100 pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Note</p>
              <p className="mt-1 text-sm text-slate-700">{dipendente.note}</p>
            </div>
          )}
          <p className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-400">
            I valori economici sono quelli inseriti manualmente dal titolare sulla base dei prospetti del
            consulente del lavoro: l&apos;app non calcola contributi, TFR o netto in busta.
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Cedolini</h2>
          <p className="mb-4 mt-1 text-sm text-slate-500">
            Archivio dei cedolini paga mensili in PDF, per averli sempre a portata di mano.
          </p>

          <div className="mb-6">
            <CedolinoUploadForm dipendenteId={dipendente.id} disabled={!storageConfigured} />
          </div>

          <ul className="divide-y divide-slate-100">
            {dipendente.cedolini.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <a href={c.fileUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-600 hover:text-brand-800">
                  📄 {MESI_LABELS_BREVI[c.mese - 1]} {c.anno}
                </a>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">Caricato il {formatDate(c.dataCaricamento)}</span>
                  <DeleteButton action={deleteCedolino.bind(null, c.id, dipendente.id)} />
                </div>
              </li>
            ))}
            {dipendente.cedolini.length === 0 && <p className="py-4 text-sm text-slate-500">Nessun cedolino caricato.</p>}
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
