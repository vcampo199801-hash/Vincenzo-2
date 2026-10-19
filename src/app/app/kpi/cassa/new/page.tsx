import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { createMovimentoCassa } from "@/lib/actions/cassa";
import { toIsoDate } from "@/lib/kpi";
import { PageHeader } from "@/components/ui/page-header";
import { KpiTabs } from "@/components/app/kpi-tabs";
import { MovimentoCassaForm } from "@/components/app/movimento-cassa-form";
import { UnsavedChangesGuard } from "@/components/app/unsaved-changes-guard";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function NewMovimentoCassaPage() {
  const { studio } = await requireActiveSubscription("kpi");

  const membri = await prisma.membership.findMany({ where: { studioId: studio.id }, include: { user: true } });
  const operatori = membri.map((m) => m.user.name ?? m.user.email).sort();

  return (
    <div className="max-w-2xl">
      <KpiTabs />
      <PageHeader title="Nuovo movimento di cassa" />
      <UnsavedChangesGuard>
        <MovimentoCassaForm action={createMovimentoCassa} defaultValues={{ data: toIsoDate(new Date()) }} operatori={operatori} />
      </UnsavedChangesGuard>
    </div>
  );
}
