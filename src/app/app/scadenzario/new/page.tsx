import { requireActiveSubscription } from "@/lib/auth-guards";
import { createAdempimento } from "@/lib/actions/scadenzario";
import { PageHeader } from "@/components/ui/page-header";
import { Field, TextAreaField, SubmitButton } from "@/components/ui/form";
import { PeriodicitaFields } from "@/components/app/periodicita-fields";

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
        <PeriodicitaFields defaultPeriodicita="Annuale" defaultMesi={12} />
        <Field label="Data ultimo controllo" name="dataUltimoControllo" type="date" />
        <TextAreaField label="Note" name="note" />
        <SubmitButton>Salva adempimento</SubmitButton>
      </form>
    </div>
  );
}
