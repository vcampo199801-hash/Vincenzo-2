import { notFound } from "next/navigation";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { aggiornaSpesa } from "@/lib/actions/spese";
import { CATEGORIA_SPESA_OPTIONS } from "@/lib/spese";
import { PageHeader } from "@/components/ui/page-header";
import { Field, SelectField, TextAreaField, SubmitButton } from "@/components/ui/form";
import { RicorrenzaField } from "@/components/app/ricorrenza-field";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function ModificaSpesaPage({ params }: { params: Promise<{ id: string }> }) {
  const { studio } = await requireActiveSubscription("spese");
  const { id } = await params;
  const spesa = await prisma.spesaStudio.findFirst({ where: { id, studioId: studio.id } });
  if (!spesa) notFound();

  const updateWithId = aggiornaSpesa.bind(null, spesa.id);

  return (
    <div className="max-w-xl">
      <PageHeader title="Modifica spesa" />
      <form action={updateWithId} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Field label="Data" name="data" type="date" required defaultValue={toIsoDate(spesa.data)} />
        <SelectField label="Categoria" name="categoria" options={CATEGORIA_SPESA_OPTIONS} defaultValue={spesa.categoria} required />
        <Field label="Importo (€)" name="importo" type="number" step="0.01" required defaultValue={spesa.importo} />
        <TextAreaField label="Descrizione" name="descrizione" defaultValue={spesa.descrizione} />
        <RicorrenzaField defaultRicorrenzaMesi={spesa.ricorrenzaMesi} />
        <SubmitButton>Salva modifiche</SubmitButton>
      </form>
    </div>
  );
}
