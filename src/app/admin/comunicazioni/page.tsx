import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ComunicazioneForm } from "@/components/admin/comunicazione-form";
import { CorreggiEmailButton } from "@/components/admin/correggi-email-button";
import { formatDate } from "@/lib/compliance";
import type { Destinatari } from "@/lib/actions/admin-comunicazioni";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DESTINATARI_LABEL: Record<string, string> = {
  tutti: "Tutti gli studi",
  attivi: "Solo abbonati attivi",
  prova: "Solo in prova gratuita",
  singolo: "Un singolo studio",
};

function comeDestinatari(value: string): Destinatari {
  return value === "attivi" || value === "prova" || value === "singolo" ? value : "tutti";
}

export default async function ComunicazioniPage({
  searchParams,
}: {
  searchParams: Promise<{ rinvia?: string }>;
}) {
  const { rinvia: rinviaId } = await searchParams;

  const [tutti, attivi, prova, senzaEmail, storico, comunicazioneDaRinviare, studi] = await Promise.all([
    prisma.studio.count({ where: { email: { not: null } } }),
    prisma.studio.count({ where: { email: { not: null }, subscription: { status: "ACTIVE" } } }),
    prisma.studio.count({ where: { email: { not: null }, subscription: { status: "TRIALING" } } }),
    prisma.studio.count({ where: { email: null } }),
    prisma.comunicazione.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        _count: { select: { invii: { where: { apertaAt: { not: null } } } } },
        invii: { take: 1, select: { studio: { select: { name: true } } } },
      },
    }),
    rinviaId
      ? prisma.comunicazione.findUnique({
          where: { id: rinviaId },
          include: { invii: { take: 1, select: { studioId: true } } },
        })
      : null,
    prisma.studio.findMany({ where: { email: { not: null } }, select: { id: true, name: true, email: true }, orderBy: { name: "asc" } }),
  ]);

  const conteggi: Record<Destinatari, number> = { tutti, attivi, prova, singolo: 1 };
  const rinvia = comunicazioneDaRinviare
    ? {
        id: comunicazioneDaRinviare.id,
        oggetto: comunicazioneDaRinviare.oggetto,
        messaggio: comunicazioneDaRinviare.messaggio,
        destinatari: comeDestinatari(comunicazioneDaRinviare.destinatari),
        studioId: comunicazioneDaRinviare.invii[0]?.studioId,
      }
    : null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="text-xl font-semibold text-slate-900">Comunicazione agli iscritti</h1>
      <p className="mt-1 text-sm text-slate-500">
        Invia un&apos;email una tantum a chi è registrato — per annunci che non sono scadenze o avvisi
        sull&apos;abbonamento (es. un consiglio d&apos;uso, una nuova funzionalità), o a un singolo studio.
      </p>
      <div className="mt-6">
        <CorreggiEmailButton mancanti={senzaEmail} />
      </div>
      <ComunicazioneForm conteggi={conteggi} rinvia={rinvia} studi={studi as { id: string; name: string; email: string }[]} />

      <div className="mt-10 border-t border-slate-200 pt-6">
        <h2 className="text-sm font-semibold text-slate-900">Storico invii</h2>
        {storico.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">Non hai ancora mandato nessuna comunicazione.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {storico.map((c) => (
              <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-900">{c.oggetto}</p>
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-slate-400">{formatDate(c.createdAt)}</p>
                    <Link href={`/admin/comunicazioni?rinvia=${c.id}`} className="text-xs font-medium text-brand-700 hover:underline">
                      Rinvia
                    </Link>
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {c.destinatari === "singolo"
                    ? `A ${c.invii[0]?.studio.name ?? "uno studio (rimosso da allora)"}`
                    : DESTINATARI_LABEL[c.destinatari] ?? c.destinatari}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                    {c.inviate} inviate
                  </span>
                  {c.fallite > 0 && (
                    <span className="rounded-full bg-red-50 px-2.5 py-1 font-medium text-red-700">
                      {c.fallite} fallite
                    </span>
                  )}
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                    {c._count.invii} aperte
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-slate-400">
          &quot;Aperte&quot; conta solo se in Resend è attivo l&apos;Open Tracking sul dominio e il webhook verso
          questa app — finché non li colleghi resta sempre a 0. Anche una volta collegato, è una stima per difetto:
          alcuni client email (es. Apple Mail) precaricano le immagini per privacy e non sono distinguibili da
          un&apos;apertura reale, quindi il numero può sia sottostimare sia sovrastimare le letture effettive.
        </p>
      </div>
    </div>
  );
}
