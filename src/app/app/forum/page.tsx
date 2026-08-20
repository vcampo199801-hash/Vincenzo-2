import Link from "next/link";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { CATEGORIA_FORUM_OPTIONS, categoriaLabel, nomeAutore, formatDataOra } from "@/lib/forum";
import { attivaForum, disattivaForum } from "@/lib/actions/forum";
import { PageHeader } from "@/components/ui/page-header";
import { DeleteButton } from "@/components/ui/delete-button";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function ForumPage({ searchParams }: { searchParams: Promise<{ categoria?: string }> }) {
  const { studio } = await requireActiveSubscription("forum");

  if (!studio.forumAttivo) {
    return <FormPartecipazione studio={studio} />;
  }

  const { categoria } = await searchParams;
  const categoriaFiltro = CATEGORIA_FORUM_OPTIONS.some((c) => c.value === categoria) ? categoria : undefined;

  const posts = await prisma.forumPost.findMany({
    where: {
      ...(categoriaFiltro ? { categoria: categoriaFiltro } : {}),
      OR: [{ nascosto: false }, { studioId: studio.id }],
    },
    include: { studio: true, _count: { select: { commenti: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <PageHeader
        title="Forum"
        description="Il confronto tra colleghi degli studi iscritti a Scadenze in Regola: dubbi clinici e gestionali, consigli, bacheca."
        action="Nuovo post"
        actionHref="/app/forum/nuovo"
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
        <p className="text-slate-600">
          Partecipi come <span className="font-medium text-slate-900">{nomeAutore(studio)}</span> — questo nome è visibile agli
          altri studi iscritti al forum.
        </p>
        <DeleteButton
          action={disattivaForum}
          label="Disattiva la mia partecipazione"
          confirmMessage="Disattivare la partecipazione al forum? Non vedrai più i post degli altri studi e i tuoi non saranno più visibili a loro."
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/app/forum"
          className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium ${
            !categoriaFiltro ? "bg-brand-600 text-white" : "border border-slate-300 text-slate-700 hover:bg-slate-50"
          }`}
        >
          Tutte
        </Link>
        {CATEGORIA_FORUM_OPTIONS.map((c) => (
          <Link
            key={c.value}
            href={`/app/forum?categoria=${c.value}`}
            scroll={false}
            className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium ${
              categoriaFiltro === c.value ? "bg-brand-600 text-white" : "border border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {c.label}
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        {posts.map((post) => {
          const isProprio = post.studioId === studio.id;
          return (
            <Link
              key={post.id}
              href={`/app/forum/${post.id}`}
              className={`block rounded-xl border p-4 shadow-sm transition-colors hover:border-brand-300 ${
                post.nascosto ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"
              }`}
            >
              <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 font-medium text-brand-700">
                  {categoriaLabel(post.categoria)}
                </span>
                {post.nascosto && isProprio && (
                  <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 font-medium text-amber-800">
                    In revisione (segnalato)
                  </span>
                )}
              </div>
              <h2 className="text-base font-semibold text-slate-900">{post.titolo}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">{post.corpo}</p>
              <p className="mt-2 text-xs text-slate-400">
                {nomeAutore(post.studio)} · {formatDataOra(post.createdAt)} · {post._count.commenti}{" "}
                {post._count.commenti === 1 ? "risposta" : "risposte"}
              </p>
            </Link>
          );
        })}
        {posts.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
            Nessun post {categoriaFiltro ? "in questa categoria" : "ancora"}: sii il primo a scrivere qualcosa.
          </div>
        )}
      </div>
    </div>
  );
}

function FormPartecipazione({ studio }: { studio: { name: string; citta: string | null } }) {
  return (
    <div className="max-w-2xl">
      <PageHeader title="Forum" description="Il confronto tra colleghi degli studi iscritti a Scadenze in Regola." />
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">
          Il forum è uno spazio dove tutti gli studi iscritti a Scadenze in Regola possono confrontarsi: dubbi
          clinici e gestionali, consigli tra colleghi, bacheca generale.
        </p>
        <p className="mt-3 text-sm text-slate-600">
          Non è anonimo: se aderisci, i tuoi post e commenti saranno firmati come{" "}
          <span className="font-medium text-slate-900">{nomeAutore(studio)}</span> e visibili a tutti gli altri
          studi che partecipano — allo stesso modo tu vedrai i loro. Puoi disattivare la partecipazione in
          qualsiasi momento da questa stessa pagina.
        </p>
        <form action={attivaForum} className="mt-5">
          <button
            type="submit"
            className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
          >
            Attiva la mia partecipazione al forum
          </button>
        </form>
      </div>
    </div>
  );
}
