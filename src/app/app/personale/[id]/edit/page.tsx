import { notFound } from "next/navigation";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { updateDipendente } from "@/lib/actions/personale";
import { MANSIONE_OPTIONS, TIPO_CONTRATTO_OPTIONS, STATO_DIPENDENTE_OPTIONS } from "@/lib/personale";
import { PageHeader } from "@/components/ui/page-header";
import { Field, SelectField, TextAreaField, SubmitButton } from "@/components/ui/form";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function EditDipendentePage({ params }: { params: Promise<{ id: string }> }) {
  const { studio } = await requireActiveSubscription("personale");
  const { id } = await params;
  const item = await prisma.dipendente.findFirst({ where: { id, studioId: studio.id } });
  if (!item) notFound();

  const updateWithId = updateDipendente.bind(null, item.id);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Modifica dipendente" />
      <form action={updateWithId} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nome" name="nome" required defaultValue={item.nome} />
          <Field label="Cognome" name="cognome" required defaultValue={item.cognome} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Mansione" name="mansione" defaultValue={item.mansione} options={MANSIONE_OPTIONS} />
          <SelectField label="Tipo contratto" name="tipoContratto" defaultValue={item.tipoContratto} options={TIPO_CONTRATTO_OPTIONS} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Data assunzione" name="dataAssunzione" type="date" required defaultValue={item.dataAssunzione?.toISOString().slice(0, 10)} />
          <Field
            label="Data scadenza contratto"
            name="dataScadenzaContratto"
            type="date"
            defaultValue={item.dataScadenzaContratto?.toISOString().slice(0, 10)}
            hint="Facoltativo. Solo per i contratti a tempo determinato."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Fine periodo di prova"
            name="finePeriodoProva"
            type="date"
            defaultValue={item.finePeriodoProva?.toISOString().slice(0, 10)}
            hint="Facoltativo."
          />
          <Field
            label="Ore settimanali"
            name="oreSettimanali"
            type="number"
            step="0.5"
            defaultValue={item.oreSettimanali}
            hint="Facoltativo. Es. 36-38 per il tempo pieno."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Stipendio lordo mensile (€)"
            name="stipendioLordoMensile"
            type="number"
            step="0.01"
            defaultValue={item.stipendioLordoMensile}
            hint="Facoltativo. Dal prospetto del consulente del lavoro."
          />
          <Field
            label="Costo aziendale mensile (€)"
            name="costoAziendaleMensile"
            type="number"
            step="0.01"
            defaultValue={item.costoAziendaleMensile}
            hint="Facoltativo. Il costo totale a carico dello studio, dal prospetto del consulente."
          />
        </div>
        <SelectField label="Stato" name="stato" defaultValue={item.stato} options={STATO_DIPENDENTE_OPTIONS} />
        <TextAreaField label="Note" name="note" defaultValue={item.note} />
        <SubmitButton>Salva modifiche</SubmitButton>
      </form>
    </div>
  );
}
