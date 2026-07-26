import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { CATEGORIA_MATERIALE_OPTIONS, optionLabel, embedVideoUrl } from "@/lib/comunicazione";
import { eliminaMateriale } from "@/lib/actions/comunicazione";
import { PageHeader } from "@/components/ui/page-header";
import { DeleteButton } from "@/components/ui/delete-button";
import { CopyLinkButton } from "@/components/app/copy-link-button";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export default async function MaterialeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { studio } = await requireActiveSubscription("comunicazione");
  const { id } = await params;
  const materiale = await prisma.materialeInformativo.findFirst({ where: { id, studioId: studio.id } });
  if (!materiale) notFound();

  const embedUrl = embedVideoUrl(materiale.videoUrl);
  const linkPubblico = `${appUrl()}/m/${materiale.id}`;

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={materiale.titolo}
        description={optionLabel(CATEGORIA_MATERIALE_OPTIONS, materiale.categoria)}
        action="Modifica"
        actionHref={`/app/comunicazione/${materiale.id}/edit`}
      />

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {materiale.immagineUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- anteprima di un'immagine ospitata su Blob
          <img src={materiale.immagineUrl} alt="" className="w-full rounded-lg border border-slate-200 object-cover" />
        )}
        {embedUrl ? (
          <div className="aspect-video w-full overflow-hidden rounded-lg border border-slate-200">
            <iframe src={embedUrl} className="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
          </div>
        ) : (
          materiale.videoUrl && (
            <a href={materiale.videoUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brand-600 hover:text-brand-800">
              Apri il video →
            </a>
          )
        )}
        {materiale.descrizione && <p className="text-sm leading-relaxed text-slate-700">{materiale.descrizione}</p>}

        <div className="border-t border-slate-100 pt-4">
          <p className="mb-2 text-xs text-slate-500">
            Questa pagina è visibile solo a te. Il link qui sotto è invece pubblico (nessun login richiesto): il
            paziente può aprirlo per vedere immagine, video e spiegazione, senza accedere al resto dell&apos;app.
          </p>
          <CopyLinkButton url={linkPubblico} />
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <Link href="/app/comunicazione" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            ← Torna all&apos;elenco
          </Link>
          <DeleteButton action={eliminaMateriale.bind(null, materiale.id)} />
        </div>
      </div>
    </div>
  );
}
