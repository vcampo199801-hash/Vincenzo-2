import { requireActiveSubscription } from "@/lib/auth-guards";
import { createFornitore } from "@/lib/actions/fornitori";
import { PageHeader } from "@/components/ui/page-header";
import { Field, SelectField, CheckboxField, TextAreaField, SubmitButton } from "@/components/ui/form";
import { UnsavedChangesGuard } from "@/components/app/unsaved-changes-guard";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function NewFornitorePage() {
  await requireActiveSubscription("fornitori");

  return (
    <div className="max-w-2xl">
      <PageHeader title="Aggiungi fornitore" />
      <UnsavedChangesGuard>
      <form action={createFornitore} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <SelectField
          label="Tipo"
          name="tipo"
          defaultValue="COMPLIANCE"
          options={[
            { value: "COMPLIANCE", label: "Referente compliance" },
            { value: "MATERIALI", label: "Fornitore materiali" },
          ]}
        />
        <Field label="Ruolo / categoria" name="ruolo" required placeholder="Es. Medico competente" />
        <Field label="Nome / Ditta" name="nome" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Telefono" name="telefono" />
          <Field label="Email" name="email" type="email" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end">
          <Field label="Scadenza contratto" name="scadenzaContratto" type="date" hint="Facoltativo." />
          <CheckboxField label="Rinnovo tacito" name="rinnovoTacito" />
        </div>
        <TextAreaField label="Note" name="note" />
        <SubmitButton>Salva fornitore</SubmitButton>
      </form>
      </UnsavedChangesGuard>
    </div>
  );
}
