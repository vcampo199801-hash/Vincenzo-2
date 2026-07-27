import { requireActiveSubscription } from "@/lib/auth-guards";
import { creaSpesa } from "@/lib/actions/spese";
import { CATEGORIA_SPESA_OPTIONS } from "@/lib/spese";
import { PageHeader } from "@/components/ui/page-header";
import { Field, SelectField, TextAreaField, CheckboxField, SubmitButton } from "@/components/ui/form";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function NuovaSpesaPage() {
  await requireActiveSubscription("spese");

  return (
    <div className="max-w-xl">
      <PageHeader title="Aggiungi spesa" />
      <form action={creaSpesa} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Field label="Data" name="data" type="date" required defaultValue={toIsoDate(new Date())} />
        <SelectField label="Categoria" name="categoria" options={CATEGORIA_SPESA_OPTIONS} defaultValue="ALTRO" required />
        <Field label="Importo (€)" name="importo" type="number" step="0.01" required />
        <TextAreaField label="Descrizione" name="descrizione" placeholder="Es. Canone di locazione luglio" />
        <CheckboxField label="Spesa ricorrente (es. ogni mese)" name="ricorrente" />
        <SubmitButton>Salva spesa</SubmitButton>
      </form>
    </div>
  );
}
