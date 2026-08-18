import Link from "next/link";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { CATEGORIA_MATERIALE_OPTIONS, optionLabel } from "@/lib/comunicazione";
import { PageHeader } from "@/components/ui/page-header";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function ComunicazionePage() {
  const { studio } = await requireActiveSubscription("comunicazione");

  const materiali = await prisma.materialeInformativo.findMany({
    where: { studioId: studio.id },
    orderBy: [{ categoria: "asc" }, { titolo: "asc" }],
  });

  return (
    <div>
      <PageHeader
        title="Comunicazione Pazienti"
        description="Immagini e video esplicativi da mostrare in studio o condividere con un link prima dell'appuntamento."
        action="Nuovo materiale"
        actionHref="/app/comunicazione/new"
      />
      <p className="mb-6 max-w-3xl text-sm text-slate-500">
        Non generiamo video: colleghi qui video già esistenti (YouTube, Vimeo — anche animazioni trovate online o
        acquistate) e aggiungi immagini e una spiegazione in linguaggio semplice, organizzati per trattamento.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {materiali.map((m) => (
          <Link
            key={m.id}
            href={`/app/comunicazione/${m.id}`}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-colors hover:border-brand-300"
          >
            <div className="flex h-32 items-center justify-center bg-slate-100">
              {m.immagineUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- anteprima di un'immagine ospitata su Blob
                <img src={m.immagineUrl} alt="" className="h-full w-full object-cover" />
              ) : m.videoUrl ? (
                <span className="text-3xl">🎬</span>
              ) : (
                <span className="text-3xl">🦷</span>
              )}
            </div>
            <div className="p-4">
              <span className="mb-1 inline-block rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                {optionLabel(CATEGORIA_MATERIALE_OPTIONS, m.categoria)}
              </span>
              <h2 className="font-semibold text-slate-900">{m.titolo}</h2>
              {m.descrizione && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{m.descrizione}</p>}
            </div>
          </Link>
        ))}
      </div>

      {materiali.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center shadow-sm">
          <p className="text-sm text-slate-500">Non hai ancora aggiunto materiale informativo per i pazienti.</p>
          <Link
            href="/app/comunicazione/new"
            className="mt-3 inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
          >
            Aggiungi il primo materiale
          </Link>
        </div>
      )}
    </div>
  );
}
