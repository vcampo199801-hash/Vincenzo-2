import { requireActiveSubscription } from "@/lib/auth-guards";
import { createPreventivo } from "@/lib/actions/kpi";
import { STATO_PREVENTIVO_OPTIONS, MODALITA_PAGAMENTO_OPTIONS, toIsoDate } from "@/lib/kpi";
import { PageHeader } from "@/components/ui/page-header";
import { Field, SelectField, CheckboxField, TextAreaField, SubmitButton } from "@/components/ui/form";
import { UnsavedChangesGuard } from "@/components/app/unsaved-changes-guard";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function NewPreventivoPage() {
  await requireActiveSubscription("kpi");

  return (
    <div className="max-w-2xl">
      <PageHeader title="Nuovo preventivo" />
      <UnsavedChangesGuard>
      <form action={createPreventivo} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Data" name="data" type="date" required defaultValue={toIsoDate(new Date())} />
          <Field label="Dottore" name="dottore" required placeholder="Es. Dott. Rossi" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Commerciale" name="commerciale" placeholder="Facoltativo" />
          <SelectField label="Stato" name="stato" defaultValue="PRESENTATO" options={STATO_PREVENTIVO_OPTIONS} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Totale proposto (€)" name="totaleProposto" type="number" step="0.01" required />
          <Field
            label="Totale accettato (€)"
            name="totaleAccettato"
            type="number"
            step="0.01"
            hint="Lascia vuoto se non ancora deciso."
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Scadenza del preventivo" name="scadenza" type="date" hint="Facoltativo." />
          <SelectField
            label="Modalità di pagamento"
            name="modalitaPagamento"
            defaultValue=""
            options={[{ value: "", label: "Non specificata" }, ...MODALITA_PAGAMENTO_OPTIONS]}
          />
        </div>
        <CheckboxField label="Il paziente ha un'assicurazione" name="assicurazione" />
        <TextAreaField label="Note" name="note" />
        <SubmitButton>Salva preventivo</SubmitButton>
      </form>
      </UnsavedChangesGuard>
    </div>
  );
}
