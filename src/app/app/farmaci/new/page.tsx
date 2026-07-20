import { requireActiveSubscription } from "@/lib/auth-guards";
import { createFarmaco } from "@/lib/actions/farmaci";
import { PageHeader } from "@/components/ui/page-header";
import { Field, TextAreaField, SubmitButton } from "@/components/ui/form";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function NewFarmacoPage() {
  await requireActiveSubscription();

  return (
    <div className="max-w-2xl">
      <PageHeader title="Aggiungi farmaco / presidio" />
      <form action={createFarmaco} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Field label="Farmaco / Presidio" name="nome" required placeholder="Es. Adrenalina 1 mg/ml — fiale" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Categoria d'uso" name="categoriaUso" placeholder="Es. Emergenza allergica" />
          <Field label="Dove si trova" name="doveSiTrova" placeholder="Es. Carrello emergenza" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Quantità" name="quantita" type="number" defaultValue={1} />
          <Field label="Lotto" name="lotto" />
          <Field label="Scadenza" name="scadenza" type="date" />
        </div>
        <TextAreaField label="Note" name="note" />
        <SubmitButton>Salva</SubmitButton>
      </form>
    </div>
  );
}
