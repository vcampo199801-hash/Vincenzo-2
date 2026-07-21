import { notFound } from "next/navigation";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { updateEcm } from "@/lib/actions/ecm";
import { PageHeader } from "@/components/ui/page-header";
import { Field, SubmitButton } from "@/components/ui/form";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function EditEcmPage({ params }: { params: Promise<{ id: string }> }) {
  const { studio } = await requireActiveSubscription("ecm");
  const { id } = await params;
  const item = await prisma.ecmCredito.findFirst({ where: { id, studioId: studio.id } });
  if (!item) notFound();

  const updateWithId = updateEcm.bind(null, item.id);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Modifica crediti ECM" />
      <form action={updateWithId} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Field label="Professionista" name="professionista" required defaultValue={item.professionista} />
        <div className="grid grid-cols-3 gap-4">
          <Field label="Crediti anno 1" name="crediti2026" type="number" defaultValue={item.crediti2026} />
          <Field label="Crediti anno 2" name="crediti2027" type="number" defaultValue={item.crediti2027} />
          <Field label="Crediti anno 3" name="crediti2028" type="number" defaultValue={item.crediti2028} />
        </div>
        <Field label="Target crediti triennio" name="target" type="number" defaultValue={item.target} />
        <SubmitButton>Salva modifiche</SubmitButton>
      </form>
    </div>
  );
}
