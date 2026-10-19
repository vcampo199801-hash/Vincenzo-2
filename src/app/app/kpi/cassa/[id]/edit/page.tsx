import { notFound } from "next/navigation";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { updateMovimentoCassa } from "@/lib/actions/cassa";
import { toIsoDate } from "@/lib/kpi";
import { PageHeader } from "@/components/ui/page-header";
import { KpiTabs } from "@/components/app/kpi-tabs";
import { MovimentoCassaForm } from "@/components/app/movimento-cassa-form";
import { UnsavedChangesGuard } from "@/components/app/unsaved-changes-guard";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function EditMovimentoCassaPage({ params }: { params: Promise<{ id: string }> }) {
  const { studio } = await requireActiveSubscription("kpi");
  const { id } = await params;

  const [item, membri] = await Promise.all([
    prisma.movimentoCassa.findFirst({ where: { id, studioId: studio.id } }),
    prisma.membership.findMany({ where: { studioId: studio.id }, include: { user: true } }),
  ]);
  if (!item) notFound();
  const operatori = membri.map((m) => m.user.name ?? m.user.email).sort();

  const updateWithId = updateMovimentoCassa.bind(null, item.id);

  return (
    <div className="max-w-2xl">
      <KpiTabs />
      <PageHeader title="Modifica movimento di cassa" />
      <UnsavedChangesGuard>
        <MovimentoCassaForm
          action={updateWithId}
          submitLabel="Salva modifiche"
          operatori={operatori}
          defaultValues={{
            tipo: item.tipo,
            data: toIsoDate(item.data),
            importo: item.importo,
            modalitaIncasso: item.modalitaIncasso,
            numeroFattura: item.numeroFattura,
            nominativo: item.nominativo,
            note: item.note,
            fotocopiaFR: item.fotocopiaFR,
            timbroRSD: item.timbroRSD,
            dataVersamento: item.dataVersamento ? toIsoDate(item.dataVersamento) : undefined,
          }}
        />
      </UnsavedChangesGuard>
    </div>
  );
}
