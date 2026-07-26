import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CATEGORIA_MATERIALE_OPTIONS, optionLabel, embedVideoUrl } from "@/lib/comunicazione";

// Pagina pubblica, senza login: pensata per essere aperta dal paziente da un
// link inviato via SMS/email/WhatsApp prima dell'appuntamento.
export const dynamic = "force-dynamic";

export default async function MaterialePubblicoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const materiale = await prisma.materialeInformativo.findUnique({
    where: { id },
    include: { studio: { select: { name: true } } },
  });
  if (!materiale) notFound();

  const embedUrl = embedVideoUrl(materiale.videoUrl);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Image src="/brand/monogram.png" alt="" width={24} height={24} className="h-6 w-6" />
          <span>{materiale.studio.name}</span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {materiale.immagineUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- immagine ospitata su Blob, dimensioni non note in anticipo
            <img src={materiale.immagineUrl} alt="" className="w-full object-cover" />
          )}
          <div className="p-6">
            <span className="mb-2 inline-block rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
              {optionLabel(CATEGORIA_MATERIALE_OPTIONS, materiale.categoria)}
            </span>
            <h1 className="text-xl font-semibold text-slate-900">{materiale.titolo}</h1>

            {embedUrl && (
              <div className="mt-4 aspect-video w-full overflow-hidden rounded-lg border border-slate-200">
                <iframe src={embedUrl} className="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
              </div>
            )}

            {materiale.descrizione && <p className="mt-4 text-sm leading-relaxed text-slate-700">{materiale.descrizione}</p>}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Questo materiale ha solo scopo informativo e non sostituisce il colloquio con il tuo odontoiatra: per
          qualsiasi dubbio sul tuo caso specifico, parlane con lo studio.
        </p>
      </div>
    </div>
  );
}
