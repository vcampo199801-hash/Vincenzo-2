import { requireStudio } from "@/lib/auth-guards";
import { updateStudioInfo } from "@/lib/actions/studio";
import { PageHeader } from "@/components/ui/page-header";
import { Field, SubmitButton } from "@/components/ui/form";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function ImpostazioniPage() {
  const { session, studio } = await requireStudio();

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <PageHeader title="Impostazioni studio" description="Dati anagrafici che compaiono nel cruscotto e nei documenti." />
        <form action={updateStudioInfo} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <Field label="Nome dello studio" name="name" required defaultValue={studio.name} />
          <Field label="Titolare" name="titolare" defaultValue={studio.titolare} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Città" name="citta" defaultValue={studio.citta} />
            <Field label="Telefono" name="telefono" defaultValue={studio.telefono} />
          </div>
          <Field label="Email" name="email" type="email" defaultValue={studio.email} />
          <SubmitButton>Salva impostazioni</SubmitButton>
        </form>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Account</h2>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-sm text-slate-600">
          <p>Email di accesso: <span className="font-medium text-slate-900">{session.email}</span></p>
        </div>
      </div>
    </div>
  );
}
