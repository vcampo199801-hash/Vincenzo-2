import { notFound } from "next/navigation";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { categoriaLabel, nomeAutore, formatDataOra } from "@/lib/forum";
import { creaCommento, eliminaPost, eliminaCommento, segnalaPost, segnalaCommento, toggleNotificaPost } from "@/lib/actions/forum";
import { PageHeader } from "@/components/ui/page-header";
import { DeleteButton } from "@/components/ui/delete-button";
import { TextAreaField, SubmitButton } from "@/components/ui/form";
import { UnsavedChangesGuard } from "@/components/app/unsaved-changes-guard";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function PostForumPage({ params }: { params: Promise<{ id: string }> }) {
  const { studio } = await requireActiveSubscription("forum");
  const { id } = await params;

  const post = await prisma.forumPost.findUnique({
    where: { id },
    include: {
      studio: true,
      commenti: { include: { studio: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!post) notFound();

  const isProprio = post.studioId === studio.id;
  if (post.nascosto && !isProprio) notFound();

  // Aprire il proprio post segna tutte le risposte come lette: fa sparire il
  // pallino di notifica nel menu senza bisogno di un'azione separata.
  if (isProprio) {
    const nonLette = post.commenti.filter((c) => c.studioId !== studio.id && !c.lettoDaAutore);
    if (nonLette.length > 0) {
      await prisma.forumCommento.updateMany({
        where: { postId: post.id, studioId: { not: studio.id }, lettoDaAutore: false },
        data: { lettoDaAutore: true },
      });
    }
  }

  const creaCommentoConId = creaCommento.bind(null, post.id);
  const eliminaPostConId = eliminaPost.bind(null, post.id);
  const segnalaPostConId = segnalaPost.bind(null, post.id);
  const toggleNotificaConId = toggleNotificaPost.bind(null, post.id);

  return (
    <div className="max-w-2xl">
      <PageHeader title={post.titolo} />

      {post.nascosto && isProprio && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Questo post è stato segnalato da più studi ed è stato nascosto in attesa di revisione: lo vedi solo tu.
          Se pensi non rispetti le regole del forum, puoi eliminarlo qui sotto.
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 font-medium text-brand-700">
            {categoriaLabel(post.categoria)}
          </span>
        </div>
        <p className="whitespace-pre-wrap text-sm text-slate-700">{post.corpo}</p>
        <p className="mt-4 text-xs text-slate-400">
          {nomeAutore(post.studio)} · {formatDataOra(post.createdAt)}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-3">
          {isProprio ? (
            <>
              <DeleteButton action={eliminaPostConId} label="Elimina post" confirmMessage="Eliminare definitivamente questo post e tutte le risposte?" />
              <form action={toggleNotificaConId}>
                <button type="submit" className="text-sm font-medium text-slate-500 hover:text-slate-800">
                  {post.notificaSilenziata ? "🔔 Riattiva notifiche email per questo post" : "🔕 Silenzia notifiche email per questo post"}
                </button>
              </form>
            </>
          ) : (
            <DeleteButton
              action={segnalaPostConId}
              label="Segnala"
              confirmMessage="Segnalare questo post come inappropriato o fuori tema?"
            />
          )}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          {post.commenti.filter((c) => !c.nascosto || c.studioId === studio.id).length}{" "}
          {post.commenti.length === 1 ? "risposta" : "risposte"}
        </h2>
        <div className="space-y-3">
          {post.commenti
            .filter((c) => !c.nascosto || c.studioId === studio.id)
            .map((c) => {
              const commentoProprio = c.studioId === studio.id;
              return (
                <div
                  key={c.id}
                  className={`rounded-xl border p-4 shadow-sm ${c.nascosto ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"}`}
                >
                  {c.nascosto && commentoProprio && (
                    <p className="mb-2 text-xs font-medium text-amber-800">In revisione (segnalato) — solo tu lo vedi.</p>
                  )}
                  <p className="whitespace-pre-wrap text-sm text-slate-700">{c.corpo}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    {nomeAutore(c.studio)} · {formatDataOra(c.createdAt)}
                  </p>
                  <div className="mt-2">
                    {commentoProprio ? (
                      <DeleteButton
                        action={eliminaCommento.bind(null, post.id, c.id)}
                        label="Elimina"
                        confirmMessage="Eliminare questa risposta?"
                      />
                    ) : (
                      <DeleteButton
                        action={segnalaCommento.bind(null, post.id, c.id)}
                        label="Segnala"
                        confirmMessage="Segnalare questa risposta come inappropriata o fuori tema?"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          {post.commenti.length === 0 && <p className="text-sm text-slate-500">Ancora nessuna risposta.</p>}
        </div>

        {studio.forumAttivo && (
          <UnsavedChangesGuard>
          <form action={creaCommentoConId} className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <TextAreaField label="Rispondi" name="corpo" placeholder="Scrivi una risposta…" />
            <SubmitButton>Invia risposta</SubmitButton>
          </form>
          </UnsavedChangesGuard>
        )}
      </div>
    </div>
  );
}
