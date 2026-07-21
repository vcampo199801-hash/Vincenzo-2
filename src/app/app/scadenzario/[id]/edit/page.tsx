import { notFound } from "next/navigation";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { updateAdempimento } from "@/lib/actions/scadenzario";
import { PageHeader } from "@/components/ui/page-header";
import { Field, TextAreaField, SubmitButton } from "@/components/ui/form";
import { PeriodicitaFields } from "@/components/app/periodicita-fields";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function EditAdempimentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { studio } = await requireActiveSubscription("scadenzario");
  const { id } = await params;

  const item = await prisma.adempimento.findFirst({ where: { id, studioId: studio.id } });
  if (!item) notFound();

  const updateWithId = updateAdempimento.bind(null, item.id);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Modifica adempimento" />
      <form action={updateWithId} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Field label="Adempimento" name="nome" required defaultValue={item.nome} />
        <Field label="Riferimento normativo / note" name="riferimento" defaultValue={item.riferimento} />
        <PeriodicitaFields defaultPeriodicita={item.periodicita} defaultMesi={item.mesi} />
        <Field
          label="Data ultimo controllo"
          name="dataUltimoControllo"
          type="date"
          defaultValue={item.dataUltimoControllo?.toISOString().slice(0, 10)}
        />
        <TextAreaField label="Note" name="note" defaultValue={item.note} />
        <SubmitButton>Salva modifiche</SubmitButton>
      </form>
    </div>
  );
}
