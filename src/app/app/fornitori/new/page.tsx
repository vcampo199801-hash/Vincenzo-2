import { requireActiveSubscription } from "@/lib/auth-guards";
import { createFornitore } from "@/lib/actions/fornitori";
import { PageHeader } from "@/components/ui/page-header";
import { Field, SelectField, CheckboxField, TextAreaField, SubmitButton } from "@/components/ui/form";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function NewFornitorePage() {
  await requireActiveSubscription("fornitori");

  return (
    <div className="max-w-2xl">
      <PageHeader title="Aggiungi fornitore" />
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
        <div className="grid grid-cols-2 gap-4">
          <Field label="Telefono" name="telefono" />
          <Field label="Email" name="email" type="email" />
        </div>
        <Field label="Scadenza contratto" name="scadenzaContratto" type="date" />
        <CheckboxField label="Contratto attivo" name="contrattoAttivo" />
        <TextAreaField label="Note" name="note" />
        <SubmitButton>Salva fornitore</SubmitButton>
      </form>
    </div>
  );
}
