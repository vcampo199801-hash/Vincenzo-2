import { notFound } from "next/navigation";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

/** Stesso approccio di /app/laboratori/documento/[id]: apre il cedolino
 * dentro l'app invece che in una scheda a parte, cosi il tasto Indietro
 * resta sempre disponibile anche quando l'app e installata come PWA. */
export default async function DocumentoPersonalePage({ params }: { params: Promise<{ id: string }> }) {
  const { studio } = await requireActiveSubscription("personale");
  const { id } = await params;

  const cedolino = await prisma.cedolino.findFirst({ where: { id, studioId: studio.id } });
  if (!cedolino) notFound();

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <h1 className="mb-3 truncate text-base font-semibold text-slate-900">{cedolino.nomeFile}</h1>
      <iframe
        src={`/api/personale/file/${cedolino.id}`}
        title={cedolino.nomeFile}
        className="min-h-0 flex-1 rounded-xl border border-slate-200 bg-slate-50"
      />
    </div>
  );
}
