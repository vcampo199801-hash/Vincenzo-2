import Link from "next/link";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { createLavorazione } from "@/lib/actions/laboratori";
import { TIPOLOGIA_LAVORAZIONE_OPTIONS, STATO_LAVORAZIONE_OPTIONS } from "@/lib/laboratori";
import { PageHeader } from "@/components/ui/page-header";
import { Field, SelectField, TextAreaField, SubmitButton } from "@/components/ui/form";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function NewLavorazionePage({ searchParams }: { searchParams: Promise<{ laboratorioId?: string }> }) {
  const { studio } = await requireActiveSubscription("laboratori");
  const { laboratorioId } = await searchParams;

  const laboratori = await prisma.laboratorio.findMany({
    where: { studioId: studio.id, stato: "ATTIVO" },
    orderBy: { ragioneSociale: "asc" },
  });

  if (laboratori.length === 0) {
    return (
      <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-slate-500">Aggiungi prima un laboratorio attivo per poter registrare una lavorazione.</p>
        <Link
          href="/app/laboratori/new"
          className="mt-3 inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
        >
          Aggiungi laboratorio
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Nuova lavorazione" />
      <form action={createLavorazione} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <SelectField
          label="Laboratorio"
          name="laboratorioId"
          required
          defaultValue={laboratorioId ?? laboratori[0].id}
          options={laboratori.map((l) => ({ value: l.id, label: l.ragioneSociale }))}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Riferimento paziente" name="riferimentoPaziente" required placeholder="Es. Rossi Mario, o codice interno" />
          <SelectField label="Tipo di lavorazione" name="tipoLavorazione" defaultValue="ALTRO" options={TIPOLOGIA_LAVORAZIONE_OPTIONS} />
        </div>
        <Field label="Elementi dentali" name="elementiDentali" placeholder="Es. 1.6, 1.7" hint="Facoltativo. Notazione libera." />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Data invio" name="dataInvio" type="date" required />
          <Field label="Data consegna prevista" name="dataConsegnaPrevista" type="date" hint="Facoltativo." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Stato" name="stato" defaultValue="INVIATO" options={STATO_LAVORAZIONE_OPTIONS} />
          <Field label="Costo (€)" name="costo" type="number" step="0.01" hint="Facoltativo." />
        </div>
        <TextAreaField label="Note" name="note" />
        <p className="text-xs text-slate-400">
          Dopo il salvataggio potrai caricare la dichiarazione di conformità e gli altri allegati (DDT, prescrizione,
          foto) dalla scheda della lavorazione.
        </p>
        <SubmitButton>Salva lavorazione</SubmitButton>
      </form>
    </div>
  );
}
