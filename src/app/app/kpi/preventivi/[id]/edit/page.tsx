import { notFound } from "next/navigation";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { updatePreventivo } from "@/lib/actions/kpi";
import { STATO_PREVENTIVO_OPTIONS, MODALITA_PAGAMENTO_OPTIONS, toIsoDate } from "@/lib/kpi";
import { PageHeader } from "@/components/ui/page-header";
import { Field, SelectField, CheckboxField, TextAreaField, SubmitButton } from "@/components/ui/form";
import { UnsavedChangesGuard } from "@/components/app/unsaved-changes-guard";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function EditPreventivoPage({ params }: { params: Promise<{ id: string }> }) {
  const { studio } = await requireActiveSubscription("kpi");
  const { id } = await params;
  const item = await prisma.preventivo.findFirst({ where: { id, studioId: studio.id } });
  if (!item) notFound();

  const updateWithId = updatePreventivo.bind(null, item.id);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Modifica preventivo" />
      <UnsavedChangesGuard>
      <form action={updateWithId} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Data" name="data" type="date" required defaultValue={toIsoDate(item.data)} />
          <Field label="Dottore" name="dottore" required defaultValue={item.dottore} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Commerciale" name="commerciale" defaultValue={item.commerciale} placeholder="Facoltativo" />
          <SelectField label="Stato" name="stato" defaultValue={item.stato} options={STATO_PREVENTIVO_OPTIONS} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Totale proposto (€)" name="totaleProposto" type="number" step="0.01" required defaultValue={item.totaleProposto} />
          <Field
            label="Totale accettato (€)"
            name="totaleAccettato"
            type="number"
            step="0.01"
            defaultValue={item.totaleAccettato ?? undefined}
            hint="Lascia vuoto se non ancora deciso."
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Scadenza del preventivo"
            name="scadenza"
            type="date"
            defaultValue={item.scadenza ? toIsoDate(item.scadenza) : undefined}
            hint="Facoltativo."
          />
          <SelectField
            label="Modalità di pagamento"
            name="modalitaPagamento"
            defaultValue={item.modalitaPagamento ?? ""}
            options={[{ value: "", label: "Non specificata" }, ...MODALITA_PAGAMENTO_OPTIONS]}
          />
        </div>
        <CheckboxField label="Il paziente ha un'assicurazione" name="assicurazione" defaultChecked={item.assicurazione} />
        <TextAreaField label="Note" name="note" defaultValue={item.note} />
        <SubmitButton>Salva modifiche</SubmitButton>
      </form>
      </UnsavedChangesGuard>
    </div>
  );
}
