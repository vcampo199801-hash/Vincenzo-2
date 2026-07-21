import { requireActiveSubscription } from "@/lib/auth-guards";
import { createDocumento } from "@/lib/actions/documenti";
import { PageHeader } from "@/components/ui/page-header";
import { Field, SelectField, TextAreaField, SubmitButton } from "@/components/ui/form";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function NewDocumentoPage() {
  await requireActiveSubscription("documenti");

  return (
    <div className="max-w-2xl">
      <PageHeader title="Aggiungi documento" />
      <form action={createDocumento} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Field label="Documento" name="nome" required placeholder="Es. Piano di emergenza ed evacuazione" />
        <SelectField
          label="Stato"
          name="stato"
          defaultValue="MANCANTE"
          options={[
            { value: "PRESENTE", label: "Presente" },
            { value: "DA_AGGIORNARE", label: "Da aggiornare" },
            { value: "MANCANTE", label: "Mancante" },
          ]}
        />
        <TextAreaField label="Note / dove si trova" name="note" />
        <SubmitButton>Salva documento</SubmitButton>
      </form>
    </div>
  );
}
