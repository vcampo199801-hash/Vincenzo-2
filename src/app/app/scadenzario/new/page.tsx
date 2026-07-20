import { requireActiveSubscription } from "@/lib/auth-guards";
import { createAdempimento } from "@/lib/actions/scadenzario";
import { PageHeader } from "@/components/ui/page-header";
import { Field, SelectField, TextAreaField, SubmitButton } from "@/components/ui/form";
import { PERIODICITA_OPTIONS } from "@/lib/compliance";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function NewAdempimentoPage() {
  await requireActiveSubscription();

  return (
    <div className="max-w-2xl">
      <PageHeader title="Nuovo adempimento" description="Aggiungi una scadenza di compliance da monitorare." />
      <form action={createAdempimento} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Field label="Adempimento" name="nome" required placeholder="Es. Manutenzione estintori" />
        <Field label="Riferimento normativo / note" name="riferimento" placeholder="Es. D.M. 1 settembre 2021" />
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Periodicità"
            name="periodicita"
            defaultValue="Annuale"
            options={PERIODICITA_OPTIONS.map((p) => ({ value: p.label, label: p.label }))}
          />
          <Field label="Mesi periodicità" name="mesi" type="number" defaultValue={12} required />
        </div>
        <Field label="Data ultimo controllo" name="dataUltimoControllo" type="date" />
        <TextAreaField label="Note" name="note" />
        <SubmitButton>Salva adempimento</SubmitButton>
      </form>
    </div>
  );
}
