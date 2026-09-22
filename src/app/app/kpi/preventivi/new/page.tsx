import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { createPreventivo } from "@/lib/actions/kpi";
import {
  STATO_PREVENTIVO_OPTIONS,
  MODALITA_PAGAMENTO_OPTIONS,
  FASCIA_ETA_OPTIONS,
  TIPO_PAZIENTE_OPTIONS,
  MOTIVO_RIFIUTO_OPTIONS,
  ASSICURAZIONI_PREDEFINITE,
  toIsoDate,
} from "@/lib/kpi";
import { PageHeader } from "@/components/ui/page-header";
import { Field, SelectField, TextAreaField, SubmitButton } from "@/components/ui/form";
import { ComboboxLista } from "@/components/ui/combobox-lista";
import { UnsavedChangesGuard } from "@/components/app/unsaved-changes-guard";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function NewPreventivoPage() {
  const { studio } = await requireActiveSubscription("kpi");

  const esistenti = await prisma.preventivo.findMany({
    where: { studioId: studio.id },
    select: { dottore: true, commerciale: true, assicurazione: true },
  });
  const dottori = [...new Set(esistenti.map((p) => p.dottore))].sort();
  const commerciali = [...new Set(esistenti.map((p) => p.commerciale).filter((c): c is string => Boolean(c)))].sort();
  const assicurazioni = [
    ...new Set([...ASSICURAZIONI_PREDEFINITE, ...esistenti.map((p) => p.assicurazione).filter((a): a is string => Boolean(a))]),
  ].sort();

  return (
    <div className="max-w-2xl">
      <PageHeader title="Nuovo preventivo" />
      <UnsavedChangesGuard>
      <form action={createPreventivo} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Data" name="data" type="date" required defaultValue={toIsoDate(new Date())} />
          <ComboboxLista label="Dottore" name="dottore" opzioni={dottori} required placeholderNuovo="Es. Dott. Rossi" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome e cognome paziente" name="pazienteNome" required />
          <SelectField
            label="Età paziente"
            name="fasciaEta"
            defaultValue=""
            options={[{ value: "", label: "Non specificata" }, ...FASCIA_ETA_OPTIONS]}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ComboboxLista label="Commerciale" name="commerciale" opzioni={commerciali} labelVuoto="Nessuno" placeholderNuovo="Nome del commerciale" />
          <SelectField
            label="Tipo paziente"
            name="tipoPaziente"
            defaultValue=""
            options={[{ value: "", label: "Non specificato" }, ...TIPO_PAZIENTE_OPTIONS]}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField label="Stato" name="stato" defaultValue="PRESENTATO" options={STATO_PREVENTIVO_OPTIONS} />
          <SelectField
            label="Motivo del rifiuto"
            name="motivoRifiuto"
            defaultValue=""
            options={[{ value: "", label: "—" }, ...MOTIVO_RIFIUTO_OPTIONS]}
            hint="Rilevante solo se lo stato è “Rifiutato”."
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Totale proposto (€)" name="totaleProposto" type="number" step="0.01" required />
          <Field
            label="Totale accettato (€)"
            name="totaleAccettato"
            type="number"
            step="0.01"
            hint="Lascia vuoto se non ancora deciso."
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Importo a listino (€)"
            name="importoListino"
            type="number"
            step="0.01"
            hint="Prezzo pieno dello studio, prima di sconti o assicurazione."
          />
          <Field
            label="Importo coperto da assicurazione (€)"
            name="importoAssicurazione"
            type="number"
            step="0.01"
            hint="Facoltativo."
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Scadenza del preventivo" name="scadenza" type="date" hint="Facoltativo." />
          <SelectField
            label="Modalità di pagamento"
            name="modalitaPagamento"
            defaultValue=""
            options={[{ value: "", label: "Non specificata" }, ...MODALITA_PAGAMENTO_OPTIONS]}
          />
        </div>
        <ComboboxLista
          label="Assicurazione"
          name="assicurazione"
          opzioni={assicurazioni}
          labelVuoto="Nessuna"
          placeholderNuovo="Nome dell'assicurazione"
        />
        <TextAreaField label="Note" name="note" />
        <SubmitButton>Salva preventivo</SubmitButton>
      </form>
      </UnsavedChangesGuard>
    </div>
  );
}
