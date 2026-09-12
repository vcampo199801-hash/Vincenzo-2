import { notFound } from "next/navigation";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { updatePreventivo } from "@/lib/actions/kpi";
import { STATO_PREVENTIVO_OPTIONS, MODALITA_PAGAMENTO_OPTIONS, toIsoDate } from "@/lib/kpi";
import { PageHeader } from "@/components/ui/page-header";
import { Field, SelectField, TextAreaField, SubmitButton } from "@/components/ui/form";
import { ComboboxLista } from "@/components/ui/combobox-lista";
import { UnsavedChangesGuard } from "@/components/app/unsaved-changes-guard";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function EditPreventivoPage({ params }: { params: Promise<{ id: string }> }) {
  const { studio } = await requireActiveSubscription("kpi");
  const { id } = await params;
  const [item, esistenti] = await Promise.all([
    prisma.preventivo.findFirst({ where: { id, studioId: studio.id } }),
    prisma.preventivo.findMany({ where: { studioId: studio.id }, select: { dottore: true, commerciale: true, assicurazione: true } }),
  ]);
  if (!item) notFound();

  const dottori = [...new Set(esistenti.map((p) => p.dottore))].sort();
  const commerciali = [...new Set(esistenti.map((p) => p.commerciale).filter((c): c is string => Boolean(c)))].sort();
  const assicurazioni = [...new Set(esistenti.map((p) => p.assicurazione).filter((a): a is string => Boolean(a)))].sort();

  const updateWithId = updatePreventivo.bind(null, item.id);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Modifica preventivo" />
      <UnsavedChangesGuard>
      <form action={updateWithId} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Data" name="data" type="date" required defaultValue={toIsoDate(item.data)} />
          <ComboboxLista label="Dottore" name="dottore" opzioni={dottori} defaultValue={item.dottore} required placeholderNuovo="Es. Dott. Rossi" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ComboboxLista
            label="Commerciale"
            name="commerciale"
            opzioni={commerciali}
            defaultValue={item.commerciale}
            labelVuoto="Nessuno"
            placeholderNuovo="Nome del commerciale"
          />
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
        <ComboboxLista
          label="Assicurazione"
          name="assicurazione"
          opzioni={assicurazioni}
          defaultValue={item.assicurazione}
          labelVuoto="Nessuna"
          placeholderNuovo="Nome dell'assicurazione"
        />
        <TextAreaField label="Note" name="note" defaultValue={item.note} />
        <SubmitButton>Salva modifiche</SubmitButton>
      </form>
      </UnsavedChangesGuard>
    </div>
  );
}
