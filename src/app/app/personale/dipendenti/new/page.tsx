import { requirePersonaleAccess } from "@/lib/auth-guards";
import { createDipendente } from "@/lib/actions/personale";
import { MANSIONE_OPTIONS, TIPO_CONTRATTO_OPTIONS, STATO_DIPENDENTE_OPTIONS } from "@/lib/personale";
import { PageHeader } from "@/components/ui/page-header";
import { Field, SelectField, TextAreaField, SubmitButton } from "@/components/ui/form";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function NewDipendentePage() {
  await requirePersonaleAccess();

  return (
    <div className="max-w-2xl">
      <PageHeader title="Nuovo dipendente" description="Dati anagrafici e contrattuali." />
      <form action={createDipendente} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nome" name="nome" required />
          <Field label="Cognome" name="cognome" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Codice fiscale" name="codiceFiscale" />
          <Field label="Data di nascita" name="dataNascita" type="date" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Mansione" name="mansione" defaultValue="ALTRO" options={MANSIONE_OPTIONS} />
          <SelectField label="Tipo contratto" name="tipoContratto" defaultValue="INDETERMINATO" options={TIPO_CONTRATTO_OPTIONS} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="CCNL" name="ccnl" placeholder="Es. Studi odontoiatrici" />
          <Field label="Livello" name="livello" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Data assunzione" name="dataAssunzione" type="date" />
          <Field label="Data fine contratto" name="dataFineContratto" type="date" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Ore settimanali" name="oreSettimanali" type="number" step="0.5" />
          <Field label="Fine periodo di prova" name="finePeriodoProva" type="date" />
        </div>
        <SelectField label="Stato" name="stato" defaultValue="ATTIVO" options={STATO_DIPENDENTE_OPTIONS} />
        <TextAreaField label="Note" name="note" />
        <SubmitButton>Salva dipendente</SubmitButton>
      </form>
    </div>
  );
}
