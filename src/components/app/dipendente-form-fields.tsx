import { MANSIONE_OPTIONS, TIPO_CONTRATTO_OPTIONS, STATO_DIPENDENTE_OPTIONS } from "@/lib/personale";
import { Field, SelectField, TextAreaField } from "@/components/ui/form";

type DipendenteDefaults = {
  nome?: string;
  cognome?: string;
  codiceFiscale?: string | null;
  dataNascita?: string;
  mansione?: string;
  tipoContratto?: string;
  ccnl?: string | null;
  livello?: string | null;
  dataAssunzione?: string;
  dataFineContratto?: string;
  oreSettimanali?: number | null;
  finePeriodoProva?: string;
  stato?: string;
  note?: string | null;
};

/** Shared by "Nuovo dipendente" e "Modifica dipendente" così le spiegazioni dei
 * campi restano identiche nei due punti e non rischiano di disallinearsi. */
export function DipendenteFormFields({ item }: { item?: DipendenteDefaults }) {
  return (
    <div className="space-y-8">
      <fieldset className="space-y-4">
        <legend className="mb-1 text-sm font-semibold text-slate-900">👤 Dati anagrafici</legend>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nome" name="nome" required defaultValue={item?.nome} />
          <Field label="Cognome" name="cognome" required defaultValue={item?.cognome} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Codice fiscale"
            name="codiceFiscale"
            defaultValue={item?.codiceFiscale}
            placeholder="Es. RSSMRA80A01H501U"
            hint="Facoltativo. Lo trovi sulla tessera sanitaria del collaboratore."
          />
          <Field label="Data di nascita" name="dataNascita" type="date" defaultValue={item?.dataNascita} hint="Facoltativo." />
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-slate-100 pt-6">
        <legend className="mb-1 text-sm font-semibold text-slate-900">📄 Contratto</legend>
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Mansione"
            name="mansione"
            defaultValue={item?.mansione ?? "ALTRO"}
            options={MANSIONE_OPTIONS}
            hint="Il ruolo svolto in studio (ASO, igienista, ecc.)."
          />
          <SelectField
            label="Tipo contratto"
            name="tipoContratto"
            defaultValue={item?.tipoContratto ?? "INDETERMINATO"}
            options={TIPO_CONTRATTO_OPTIONS}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="CCNL"
            name="ccnl"
            defaultValue={item?.ccnl}
            placeholder="Es. Studi professionali"
            hint="Facoltativo. Il contratto collettivo applicato: se non lo sai a memoria, chiedilo al consulente del lavoro o guardalo sulla busta paga."
          />
          <Field
            label="Livello"
            name="livello"
            defaultValue={item?.livello}
            placeholder="Es. 3° livello"
            hint="Facoltativo. Il livello di inquadramento del CCNL, indicato in busta paga."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Data assunzione"
            name="dataAssunzione"
            type="date"
            defaultValue={item?.dataAssunzione}
          />
          <Field
            label="Data fine contratto"
            name="dataFineContratto"
            type="date"
            defaultValue={item?.dataFineContratto}
            hint="Solo per i contratti a tempo determinato. Lascia vuoto per un contratto a tempo indeterminato."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Ore settimanali"
            name="oreSettimanali"
            type="number"
            step="0.5"
            defaultValue={item?.oreSettimanali}
            placeholder="Es. 36"
            hint="Facoltativo. Es. 36-38 per il tempo pieno, un numero minore per il part-time."
          />
          <Field
            label="Fine periodo di prova"
            name="finePeriodoProva"
            type="date"
            defaultValue={item?.finePeriodoProva}
            hint="Facoltativo. Di solito 3-6 mesi dopo l'assunzione. Lascia vuoto se il periodo di prova è già concluso."
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-slate-100 pt-6">
        <legend className="mb-1 text-sm font-semibold text-slate-900">✅ Stato e note</legend>
        <SelectField
          label="Stato"
          name="stato"
          defaultValue={item?.stato ?? "ATTIVO"}
          options={STATO_DIPENDENTE_OPTIONS}
          hint="'Cessato' nasconde il collaboratore dagli alert della dashboard ma ne conserva la storia."
        />
        <TextAreaField label="Note" name="note" defaultValue={item?.note} placeholder="Annotazioni libere, facoltative." />
      </fieldset>
    </div>
  );
}
