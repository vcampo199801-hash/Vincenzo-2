import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { createControllo } from "@/lib/actions/controlli";
import { PageHeader } from "@/components/ui/page-header";
import { Field, SelectField, TextAreaField, SubmitButton } from "@/components/ui/form";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function NewControlloPage() {
  const { studio } = await requireActiveSubscription("controlli");
  const adempimenti = await prisma.adempimento.findMany({ where: { studioId: studio.id }, orderBy: { ordine: "asc" } });

  return (
    <div className="max-w-2xl">
      <PageHeader title="Registra intervento" description="Aggiungi al registro un intervento di controllo o manutenzione." />
      <form action={createControllo} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <SelectField
          label="Adempimento collegato"
          name="adempimentoId"
          options={[{ value: "", label: "— Nessuno —" }, ...adempimenti.map((a) => ({ value: a.id, label: a.nome }))]}
        />
        <Field label="Data intervento" name="dataIntervento" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
        <Field label="Fornitore / Tecnico" name="tecnico" placeholder="Es. Antincendio Rossi S.r.l." />
        <SelectField
          label="Esito"
          name="esito"
          defaultValue="Conforme"
          options={[
            { value: "Conforme", label: "Conforme" },
            { value: "Con prescrizioni", label: "Con prescrizioni" },
            { value: "Non conforme", label: "Non conforme" },
          ]}
        />
        <Field label="Costo (€)" name="costo" type="number" step="0.01" defaultValue={0} />
        <TextAreaField label="Note" name="note" />
        <SubmitButton>Salva intervento</SubmitButton>
      </form>
    </div>
  );
}
