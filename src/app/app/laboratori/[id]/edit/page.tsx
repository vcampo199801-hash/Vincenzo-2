import { notFound } from "next/navigation";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { updateLaboratorio } from "@/lib/actions/laboratori";
import { TIPOLOGIA_LAVORAZIONE_OPTIONS, STATO_LABORATORIO_OPTIONS, parseTipologie } from "@/lib/laboratori";
import { PageHeader } from "@/components/ui/page-header";
import { Field, SelectField, TextAreaField, SubmitButton } from "@/components/ui/form";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function EditLaboratorioPage({ params }: { params: Promise<{ id: string }> }) {
  const { studio } = await requireActiveSubscription("laboratori");
  const { id } = await params;
  const item = await prisma.laboratorio.findFirst({ where: { id, studioId: studio.id } });
  if (!item) notFound();

  const tipologieSelezionate = new Set(parseTipologie(item.tipologieLavorazione));
  const updateWithId = updateLaboratorio.bind(null, item.id);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Modifica laboratorio" />
      <form action={updateWithId} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Field label="Ragione sociale" name="ragioneSociale" required defaultValue={item.ragioneSociale} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Partita IVA" name="partitaIva" defaultValue={item.partitaIva} />
          <Field label="Referente" name="referente" defaultValue={item.referente} />
        </div>
        <Field label="Indirizzo" name="indirizzo" defaultValue={item.indirizzo} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Telefono" name="telefono" defaultValue={item.telefono} />
          <Field label="Email" name="email" type="email" defaultValue={item.email} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="N. registrazione Ministero della Salute"
            name="numeroRegistrazioneMinisteriale"
            defaultValue={item.numeroRegistrazioneMinisteriale}
            hint="Come fabbricante di dispositivi su misura."
          />
          <Field
            label="Data ultima verifica registrazione"
            name="dataUltimaVerificaRegistrazione"
            type="date"
            defaultValue={item.dataUltimaVerificaRegistrazione?.toISOString().slice(0, 10)}
            hint="Verificala periodicamente: dopo 12 mesi l'app te lo ricorda."
          />
        </div>
        <fieldset className="rounded-lg border border-slate-200 p-3">
          <legend className="px-1 text-xs font-medium text-slate-600">Tipologie di lavorazione</legend>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
            {TIPOLOGIA_LAVORAZIONE_OPTIONS.map((t) => (
              <label key={t.value} className="flex items-center gap-1.5 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="tipologia"
                  value={t.value}
                  defaultChecked={tipologieSelezionate.has(t.value)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                {t.label}
              </label>
            ))}
          </div>
        </fieldset>
        <SelectField label="Stato" name="stato" defaultValue={item.stato} options={STATO_LABORATORIO_OPTIONS} />
        <TextAreaField label="Note" name="note" defaultValue={item.note} />
        <SubmitButton>Salva modifiche</SubmitButton>
      </form>
    </div>
  );
}
