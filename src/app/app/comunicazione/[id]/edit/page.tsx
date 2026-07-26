import { notFound } from "next/navigation";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { aggiornaMateriale } from "@/lib/actions/comunicazione";
import { PageHeader } from "@/components/ui/page-header";
import { MaterialeForm } from "@/components/app/materiale-form";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function ModificaMaterialePage({ params }: { params: Promise<{ id: string }> }) {
  const { studio } = await requireActiveSubscription("comunicazione");
  const { id } = await params;
  const item = await prisma.materialeInformativo.findFirst({ where: { id, studioId: studio.id } });
  if (!item) notFound();

  const updateWithId = aggiornaMateriale.bind(null, item.id);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Modifica materiale" />
      <MaterialeForm
        action={updateWithId}
        defaultValues={{ categoria: item.categoria, titolo: item.titolo, descrizione: item.descrizione, videoUrl: item.videoUrl }}
        immagineAttuale={item.immagineUrl}
      />
    </div>
  );
}
