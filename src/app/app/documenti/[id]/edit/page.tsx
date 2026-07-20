import { notFound } from "next/navigation";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { updateDocumento } from "@/lib/actions/documenti";
import { PageHeader } from "@/components/ui/page-header";
import { Field, SelectField, TextAreaField, SubmitButton } from "@/components/ui/form";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function EditDocumentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { studio } = await requireActiveSubscription();
  const { id } = await params;
  const item = await prisma.documento.findFirst({ where: { id, studioId: studio.id } });
  if (!item) notFound();

  const updateWithId = updateDocumento.bind(null, item.id);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Modifica documento" />
      <form action={updateWithId} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Field label="Documento" name="nome" required defaultValue={item.nome} />
        <SelectField
          label="Stato"
          name="stato"
          defaultValue={item.stato}
          options={[
            { value: "PRESENTE", label: "Presente" },
            { value: "DA_AGGIORNARE", label: "Da aggiornare" },
            { value: "MANCANTE", label: "Mancante" },
          ]}
        />
        <TextAreaField label="Note / dove si trova" name="note" defaultValue={item.note} />
        <SubmitButton>Salva modifiche</SubmitButton>
      </form>
    </div>
  );
}
