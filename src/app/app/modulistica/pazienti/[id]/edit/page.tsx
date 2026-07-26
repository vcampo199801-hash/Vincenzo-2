import { notFound } from "next/navigation";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { updatePaziente } from "@/lib/actions/modulistica";
import { PageHeader } from "@/components/ui/page-header";
import { Field, TextAreaField, SubmitButton } from "@/components/ui/form";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function ModificaPazientePage({ params }: { params: Promise<{ id: string }> }) {
  const { studio } = await requireActiveSubscription("modulistica");
  const { id } = await params;
  const item = await prisma.paziente.findFirst({ where: { id, studioId: studio.id } });
  if (!item) notFound();

  const updateWithId = updatePaziente.bind(null, item.id);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Modifica paziente" />
      <form action={updateWithId} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nome" name="nome" required defaultValue={item.nome} />
          <Field label="Cognome" name="cognome" required defaultValue={item.cognome} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Data di nascita" name="dataNascita" type="date" defaultValue={item.dataNascita?.toISOString().slice(0, 10)} />
          <Field label="Luogo di nascita" name="luogoNascita" defaultValue={item.luogoNascita} />
        </div>
        <Field label="Residenza (indirizzo, città)" name="residenza" defaultValue={item.residenza} />
        <Field label="Codice Fiscale" name="codiceFiscale" defaultValue={item.codiceFiscale} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Telefono" name="telefono" defaultValue={item.telefono} />
          <Field label="Email" name="email" type="email" defaultValue={item.email} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Medico curante" name="medicoCurante" defaultValue={item.medicoCurante} />
          <Field label="Professione" name="professione" defaultValue={item.professione} />
        </div>
        <TextAreaField label="Note" name="note" defaultValue={item.note} />
        <SubmitButton>Salva modifiche</SubmitButton>
      </form>
    </div>
  );
}
