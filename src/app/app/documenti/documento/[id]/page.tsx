import { notFound } from "next/navigation";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

/** Stesso approccio di /app/personale/documento/[id] e /app/laboratori/documento/[id]:
 * apre la scansione dentro l'app invece che in una scheda a parte, così il
 * tasto Indietro resta sempre disponibile anche quando l'app è installata come PWA. */
export default async function DocumentoFilePage({ params }: { params: Promise<{ id: string }> }) {
  const { studio } = await requireActiveSubscription("documenti");
  const { id } = await params;

  const documento = await prisma.documento.findFirst({ where: { id, studioId: studio.id } });
  if (!documento?.fileUrl) notFound();

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <h1 className="mb-3 truncate text-base font-semibold text-slate-900">{documento.nomeFile}</h1>
      <iframe
        src={`/api/documenti/file/${documento.id}`}
        title={documento.nomeFile ?? documento.nome}
        className="min-h-0 flex-1 rounded-xl border border-slate-200 bg-slate-50"
      />
    </div>
  );
}
