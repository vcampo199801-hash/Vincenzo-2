import { requireActiveSubscription } from "@/lib/auth-guards";
import { createDipendente } from "@/lib/actions/personale";
import { MANSIONE_OPTIONS, TIPO_CONTRATTO_OPTIONS, STATO_DIPENDENTE_OPTIONS } from "@/lib/personale";
import { PageHeader } from "@/components/ui/page-header";
import { Field, SelectField, TextAreaField, SubmitButton } from "@/components/ui/form";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function NewDipendentePage() {
  await requireActiveSubscription("personale");

  return (
    <div className="max-w-2xl">
      <PageHeader title="Nuovo dipendente" description="Dati anagrafici e contrattuali." />
      <form action={createDipendente} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nome" name="nome" required />
          <Field label="Cognome" name="cognome" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Mansione" name="mansione" defaultValue="ALTRO" options={MANSIONE_OPTIONS} />
          <SelectField label="Tipo contratto" name="tipoContratto" defaultValue="INDETERMINATO" options={TIPO_CONTRATTO_OPTIONS} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Data assunzione" name="dataAssunzione" type="date" required />
          <Field
            label="Data scadenza contratto"
            name="dataScadenzaContratto"
            type="date"
            hint="Facoltativo. Solo per i contratti a tempo determinato."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Fine periodo di prova"
            name="finePeriodoProva"
            type="date"
            hint="Facoltativo."
          />
          <Field
            label="Ore settimanali"
            name="oreSettimanali"
            type="number"
            step="0.5"
            placeholder="Es. 36"
            hint="Facoltativo. Es. 36-38 per il tempo pieno."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Stipendio lordo mensile (€)"
            name="stipendioLordoMensile"
            type="number"
            step="0.01"
            hint="Facoltativo. Dal prospetto del consulente del lavoro."
          />
          <Field
            label="Costo aziendale mensile (€)"
            name="costoAziendaleMensile"
            type="number"
            step="0.01"
            hint="Facoltativo. Il costo totale a carico dello studio, dal prospetto del consulente."
          />
        </div>
        <SelectField label="Stato" name="stato" defaultValue="ATTIVO" options={STATO_DIPENDENTE_OPTIONS} />
        <TextAreaField label="Note" name="note" />
        <SubmitButton>Salva dipendente</SubmitButton>
      </form>
    </div>
  );
}
