import { requireActiveSubscription } from "@/lib/auth-guards";
import { createPaziente } from "@/lib/actions/modulistica";
import { PageHeader } from "@/components/ui/page-header";
import { Field, TextAreaField, SubmitButton } from "@/components/ui/form";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function NuovoPazientePage() {
  await requireActiveSubscription("modulistica");

  return (
    <div className="max-w-2xl">
      <PageHeader title="Nuovo paziente" description="Solo i dati identificativi necessari a compilare i moduli." />
      <form action={createPaziente} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nome" name="nome" required />
          <Field label="Cognome" name="cognome" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Data di nascita" name="dataNascita" type="date" />
          <Field label="Luogo di nascita" name="luogoNascita" />
        </div>
        <Field label="Residenza (indirizzo, città)" name="residenza" />
        <Field label="Codice Fiscale" name="codiceFiscale" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Telefono" name="telefono" />
          <Field label="Email" name="email" type="email" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Medico curante" name="medicoCurante" />
          <Field label="Professione" name="professione" />
        </div>
        <TextAreaField label="Note" name="note" />
        <SubmitButton>Crea paziente</SubmitButton>
      </form>
    </div>
  );
}
