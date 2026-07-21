import { requireActiveSubscription } from "@/lib/auth-guards";
import { createLaboratorio } from "@/lib/actions/laboratori";
import { TIPOLOGIA_LAVORAZIONE_OPTIONS, STATO_LABORATORIO_OPTIONS } from "@/lib/laboratori";
import { PageHeader } from "@/components/ui/page-header";
import { Field, SelectField, TextAreaField, SubmitButton } from "@/components/ui/form";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function NewLaboratorioPage() {
  await requireActiveSubscription("laboratori");

  return (
    <div className="max-w-2xl">
      <PageHeader title="Nuovo laboratorio" description="Anagrafica del laboratorio odontotecnico." />
      <form action={createLaboratorio} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Field label="Ragione sociale" name="ragioneSociale" required />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Partita IVA" name="partitaIva" />
          <Field label="Referente" name="referente" />
        </div>
        <Field label="Indirizzo" name="indirizzo" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Telefono" name="telefono" />
          <Field label="Email" name="email" type="email" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="N. registrazione Ministero della Salute"
            name="numeroRegistrazioneMinisteriale"
            hint="Come fabbricante di dispositivi su misura."
          />
          <Field
            label="Data ultima verifica registrazione"
            name="dataUltimaVerificaRegistrazione"
            type="date"
            hint="Verificala periodicamente: dopo 12 mesi l'app te lo ricorda."
          />
        </div>
        <fieldset className="rounded-lg border border-slate-200 p-3">
          <legend className="px-1 text-xs font-medium text-slate-600">Tipologie di lavorazione</legend>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
            {TIPOLOGIA_LAVORAZIONE_OPTIONS.map((t) => (
              <label key={t.value} className="flex items-center gap-1.5 text-sm text-slate-700">
                <input type="checkbox" name="tipologia" value={t.value} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                {t.label}
              </label>
            ))}
          </div>
        </fieldset>
        <SelectField label="Stato" name="stato" defaultValue="ATTIVO" options={STATO_LABORATORIO_OPTIONS} />
        <TextAreaField label="Note" name="note" />
        <p className="text-xs text-slate-400">
          Dopo il salvataggio potrai caricare i documenti (visura, autorizzazione sanitaria, certificazioni) dalla
          scheda del laboratorio.
        </p>
        <SubmitButton>Salva laboratorio</SubmitButton>
      </form>
    </div>
  );
}
