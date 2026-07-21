import { requirePersonaleAccess } from "@/lib/auth-guards";
import { createDipendente } from "@/lib/actions/personale";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/form";
import { DipendenteFormFields } from "@/components/app/dipendente-form-fields";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function NewDipendentePage() {
  await requirePersonaleAccess();

  return (
    <div className="max-w-2xl">
      <PageHeader title="Nuovo dipendente" description="Dati anagrafici e contrattuali." />
      <p className="mb-6 rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-800">
        Servono solo <strong>Nome</strong> e <strong>Cognome</strong> per iniziare. Tutti gli altri campi sono
        facoltativi: puoi completarli in un secondo momento aprendo la scheda del dipendente e cliccando
        &quot;Modifica anagrafica&quot;.
      </p>
      <form action={createDipendente} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <DipendenteFormFields />
        <SubmitButton>Salva dipendente</SubmitButton>
      </form>
    </div>
  );
}
