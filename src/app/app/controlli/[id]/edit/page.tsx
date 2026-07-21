import { notFound } from "next/navigation";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { updateControllo } from "@/lib/actions/controlli";
import { PageHeader } from "@/components/ui/page-header";
import { Field, SelectField, TextAreaField, SubmitButton } from "@/components/ui/form";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function EditControlloPage({ params }: { params: Promise<{ id: string }> }) {
  const { studio } = await requireActiveSubscription("controlli");
  const { id } = await params;

  const [item, adempimenti] = await Promise.all([
    prisma.controlloLog.findFirst({ where: { id, studioId: studio.id } }),
    prisma.adempimento.findMany({ where: { studioId: studio.id }, orderBy: { ordine: "asc" } }),
  ]);
  if (!item) notFound();

  const updateWithId = updateControllo.bind(null, item.id);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Modifica intervento" />
      <form action={updateWithId} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <SelectField
          label="Adempimento collegato"
          name="adempimentoId"
          defaultValue={item.adempimentoId}
          options={[{ value: "", label: "— Nessuno —" }, ...adempimenti.map((a) => ({ value: a.id, label: a.nome }))]}
        />
        <Field label="Data intervento" name="dataIntervento" type="date" required defaultValue={item.dataIntervento.toISOString().slice(0, 10)} />
        <Field label="Fornitore / Tecnico" name="tecnico" defaultValue={item.tecnico} />
        <SelectField
          label="Esito"
          name="esito"
          defaultValue={item.esito}
          options={[
            { value: "Conforme", label: "Conforme" },
            { value: "Con prescrizioni", label: "Con prescrizioni" },
            { value: "Non conforme", label: "Non conforme" },
          ]}
        />
        <Field label="Costo (€)" name="costo" type="number" step="0.01" defaultValue={item.costo} />
        <TextAreaField label="Note" name="note" defaultValue={item.note} />
        <SubmitButton>Salva modifiche</SubmitButton>
      </form>
    </div>
  );
}
