import { prisma } from "@/lib/prisma";
import { PIANI, PIANI_ORDINE, normalizzaPiano } from "@/lib/plans";
import { formatCurrency } from "@/lib/compliance";

export const dynamic = "force-dynamic";

function inizioMeseCorrente() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export default async function AdminAndamentoPage() {
  const [attivi, prova, cancellatiMese] = await Promise.all([
    prisma.subscription.findMany({ where: { status: "ACTIVE" } }),
    prisma.subscription.count({ where: { status: "TRIALING" } }),
    prisma.subscription.count({ where: { status: "CANCELED", updatedAt: { gte: inizioMeseCorrente() } } }),
  ]);

  const mrr = attivi.reduce((sum, s) => sum + PIANI[normalizzaPiano(s.plan)].prezzoEuro, 0);
  const perPiano = PIANI_ORDINE.map((key) => ({
    piano: PIANI[key],
    conteggio: attivi.filter((s) => normalizzaPiano(s.plan) === key).length,
  }));
  const inCancellazione = attivi.filter((s) => s.cancelAtPeriodEnd).length;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-xl font-semibold text-slate-900">Andamento abbonamenti</h1>
      <p className="mt-1 text-sm text-slate-500">Vista d&apos;insieme dell&apos;attività, aggiornata in tempo reale.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Incasso mensile (MRR)</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{formatCurrency(mrr)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Abbonati attivi</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{attivi.length}</p>
          {inCancellazione > 0 && <p className="mt-1 text-xs text-amber-600">{inCancellazione} in cancellazione a fine periodo</p>}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">In prova gratuita</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{prova}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Abbonati per piano</p>
          <ul className="mt-3 space-y-2 text-sm">
            {perPiano.map(({ piano, conteggio }) => (
              <li key={piano.key} className="flex items-center justify-between">
                <span className="text-slate-600">{piano.label} ({formatCurrency(piano.prezzoEuro)}/mese)</span>
                <span className="font-semibold text-slate-900">{conteggio}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Cancellazioni questo mese</p>
          <p className="mt-2 text-2xl font-bold text-red-600">{cancellatiMese}</p>
          <p className="mt-1 text-xs text-slate-400">Abbonamenti passati a stato Annullato dal primo del mese ad oggi.</p>
        </div>
      </div>
    </div>
  );
}
