import { notFound } from "next/navigation";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

/** Pagina interna per aprire un allegato del laboratorio (visura, dichiarazione
 * di conformità, DDT, foto...) dentro l'app, invece di un link diretto in una
 * nuova scheda: quando l'app è installata come PWA, una nuova scheda dello
 * stesso dominio si apre anche lei "standalone" (nessuna barra degli
 * indirizzi, nessun tasto indietro del browser), e l'utente resta bloccato a
 * guardare il PDF senza modo di tornare all'app. Qui invece il file si apre
 * come una pagina normale, con l'intestazione e il tasto Indietro di sempre. */
export default async function DocumentoLaboratorioPage({ params }: { params: Promise<{ id: string }> }) {
  const { studio } = await requireActiveSubscription("laboratori");
  const { id } = await params;

  const allegato = await prisma.allegatoLaboratorio.findFirst({ where: { id, studioId: studio.id } });
  if (!allegato) notFound();

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <h1 className="mb-3 truncate text-base font-semibold text-slate-900">{allegato.nomeFile}</h1>
      <iframe
        src={`/api/laboratori/file/${allegato.id}`}
        title={allegato.nomeFile}
        className="min-h-0 flex-1 rounded-xl border border-slate-200 bg-slate-50"
      />
    </div>
  );
}
