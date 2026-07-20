import { notFound } from "next/navigation";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { updateFornitore } from "@/lib/actions/fornitori";
import { PageHeader } from "@/components/ui/page-header";
import { Field, SelectField, CheckboxField, TextAreaField, SubmitButton } from "@/components/ui/form";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function EditFornitorePage({ params }: { params: Promise<{ id: string }> }) {
  const { studio } = await requireActiveSubscription();
  const { id } = await params;
  const item = await prisma.fornitore.findFirst({ where: { id, studioId: studio.id } });
  if (!item) notFound();

  const updateWithId = updateFornitore.bind(null, item.id);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Modifica fornitore" />
      <form action={updateWithId} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <SelectField
          label="Tipo"
          name="tipo"
          defaultValue={item.tipo}
          options={[
            { value: "COMPLIANCE", label: "Referente compliance" },
            { value: "MATERIALI", label: "Fornitore materiali" },
          ]}
        />
        <Field label="Ruolo / categoria" name="ruolo" required defaultValue={item.ruolo} />
        <Field label="Nome / Ditta" name="nome" defaultValue={item.nome} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Telefono" name="telefono" defaultValue={item.telefono} />
          <Field label="Email" name="email" type="email" defaultValue={item.email} />
        </div>
        <Field label="Scadenza contratto" name="scadenzaContratto" type="date" defaultValue={item.scadenzaContratto?.toISOString().slice(0, 10)} />
        <CheckboxField label="Contratto attivo" name="contrattoAttivo" defaultChecked={item.contrattoAttivo} />
        <TextAreaField label="Note" name="note" defaultValue={item.note} />
        <SubmitButton>Salva modifiche</SubmitButton>
      </form>
    </div>
  );
}
