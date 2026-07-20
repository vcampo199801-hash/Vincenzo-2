import { requireActiveSubscription } from "@/lib/auth-guards";
import { createEcm } from "@/lib/actions/ecm";
import { PageHeader } from "@/components/ui/page-header";
import { Field, SubmitButton } from "@/components/ui/form";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function NewEcmPage() {
  await requireActiveSubscription();

  return (
    <div className="max-w-2xl">
      <PageHeader title="Aggiungi professionista" description="Traccia i crediti ECM per il triennio in corso." />
      <form action={createEcm} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Field label="Professionista" name="professionista" required placeholder="Dott. Mario Rossi" />
        <div className="grid grid-cols-3 gap-4">
          <Field label="Crediti anno 1" name="crediti2026" type="number" defaultValue={0} />
          <Field label="Crediti anno 2" name="crediti2027" type="number" defaultValue={0} />
          <Field label="Crediti anno 3" name="crediti2028" type="number" defaultValue={0} />
        </div>
        <Field label="Target crediti triennio" name="target" type="number" defaultValue={150} />
        <SubmitButton>Salva</SubmitButton>
      </form>
    </div>
  );
}
