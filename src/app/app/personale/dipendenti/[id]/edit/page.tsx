import { notFound } from "next/navigation";
import { requirePersonaleAccess } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { updateDipendente } from "@/lib/actions/personale";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/form";
import { DipendenteFormFields } from "@/components/app/dipendente-form-fields";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function EditDipendentePage({ params }: { params: Promise<{ id: string }> }) {
  const { studio } = await requirePersonaleAccess();
  const { id } = await params;
  const item = await prisma.dipendente.findFirst({ where: { id, studioId: studio.id } });
  if (!item) notFound();

  const updateWithId = updateDipendente.bind(null, item.id);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Modifica dipendente" />
      <form action={updateWithId} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <DipendenteFormFields
          item={{
            nome: item.nome,
            cognome: item.cognome,
            codiceFiscale: item.codiceFiscale,
            dataNascita: item.dataNascita?.toISOString().slice(0, 10),
            mansione: item.mansione,
            tipoContratto: item.tipoContratto,
            ccnl: item.ccnl,
            livello: item.livello,
            dataAssunzione: item.dataAssunzione?.toISOString().slice(0, 10),
            dataFineContratto: item.dataFineContratto?.toISOString().slice(0, 10),
            oreSettimanali: item.oreSettimanali,
            finePeriodoProva: item.finePeriodoProva?.toISOString().slice(0, 10),
            stato: item.stato,
            note: item.note,
            oreSettimanaliFullTime: item.oreSettimanaliFullTime,
            ferieAnnueContrattuali: item.ferieAnnueContrattuali,
            rolAnnueContrattuali: item.rolAnnueContrattuali,
            retribuzioneLordaAnnua: item.retribuzioneLordaAnnua,
          }}
        />
        <SubmitButton>Salva modifiche</SubmitButton>
      </form>
    </div>
  );
}
