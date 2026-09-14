import { requireActiveSubscription } from "@/lib/auth-guards";
import { createFornitore } from "@/lib/actions/fornitori";
import { TIPO_RINNOVO_OPTIONS } from "@/lib/fornitori";
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Scadenza contratto" name="scadenzaContratto" type="date" />
          <SelectField
            label="Tipo di rinnovo"
            name="tipoRinnovo"
            defaultValue=""
            options={[{ value: "", label: "Non specificato" }, ...TIPO_RINNOVO_OPTIONS]}
          />
        </div>
        <CheckboxField label="Contratto attivo" name="contrattoAttivo" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Importo fornitura (senza IVA) €" name="importo" type="number" step="0.01" hint="Facoltativo." />
          <Field label="IVA (%)" name="percentualeIva" type="number" step="0.01" defaultValue={22} />
        </div>
        <TextAreaField label="Note" name="note" />
        <SubmitButton>Salva fornitore</SubmitButton>
      </form>
      </UnsavedChangesGuard>
    </div>
  );
}
