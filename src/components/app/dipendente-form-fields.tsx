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
  oreSettimanaliFullTime?: number;
  ferieAnnueContrattuali?: number;
  rolAnnueContrattuali?: number;
  retribuzioneLordaAnnua?: number | null;
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
        <legend className="mb-1 text-sm font-semibold text-slate-900">⚙️ Parametri per il calcolo automatico</legend>
        <p className="text-xs text-slate-500">
          Facoltativi. Servono a far calcolare all&apos;app una <strong>stima</strong> di ferie/ROL maturati e del
          TFR nella scheda del dipendente, in base a tipo di contratto e ore lavorate. Restano sempre valori di
          partenza: verificali col consulente del lavoro e correggili quando vuoi.
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field
            label="Ore settimanali tempo pieno"
            name="oreSettimanaliFullTime"
            type="number"
            step="0.5"
            defaultValue={item?.oreSettimanaliFullTime ?? 36}
            hint="Le ore che il CCNL considera tempo pieno (tipico 36-38 per studi odontoiatrici)."
          />
          <Field
            label="Ferie annue (giorni, tempo pieno)"
            name="ferieAnnueContrattuali"
            type="number"
            step="0.5"
            defaultValue={item?.ferieAnnueContrattuali ?? 26}
            hint="Giorni di ferie annui a tempo pieno previsti dal CCNL (valore comune: 26)."
          />
          <Field
            label="ROL annuo (ore, tempo pieno)"
            name="rolAnnueContrattuali"
            type="number"
            step="0.5"
            defaultValue={item?.rolAnnueContrattuali ?? 32}
            hint="Ore di permesso ROL annue a tempo pieno previste dal CCNL."
          />
        </div>
        <Field
          label="Retribuzione lorda annua di riferimento (€)"
          name="retribuzioneLordaAnnua"
          type="number"
          step="0.01"
          defaultValue={item?.retribuzioneLordaAnnua}
          placeholder="Es. 24000"
          hint="Facoltativo. Pre-compila ogni anno la stima TFR, così non devi reinserirla: resta comunque modificabile."
        />
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
