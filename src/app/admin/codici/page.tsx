import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/compliance";
import { GeneraCodiceForm } from "@/components/admin/genera-codice-form";

export const dynamic = "force-dynamic";

export default async function CodiciPage() {
  const codici = await prisma.accessCode.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { studio: { select: { name: true } } },
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-xl font-semibold text-slate-900">Codici di attivazione</h1>
      <p className="mt-1 text-sm text-slate-500">
        Genera un codice omaggio (es. un mese gratis a un dottore) da dare di persona o via messaggio. Il cliente lo
        inserisce da{" "}
        <a href="/codice" className="font-medium text-brand-700 underline" target="_blank" rel="noopener noreferrer">
          app.sorrisiinregola.com/codice
        </a>{" "}
        se non ha ancora un account, oppure dalla sua pagina Abbonamento se è già iscritto — poi sceglie un piano e
        inserisce la carta su Stripe: non gli viene addebitato nulla per i giorni scelti qui, dopodiché il rinnovo
        parte in automatico. Un cliente già convertito, non solo un accesso gratuito.
      </p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <GeneraCodiceForm />
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-slate-900">Storico codici</h2>
        <div className="mt-3 space-y-2">
          {codici.length === 0 && <p className="text-sm text-slate-400">Nessun codice generato ancora.</p>}
          {codici.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div>
                <p className="font-mono text-sm font-semibold text-slate-900">{c.code}</p>
                <p className="text-xs text-slate-500">
                  {c.days} giorni {c.batchNote && `· ${c.batchNote}`} · creato il {formatDate(c.createdAt)} ·{" "}
                  {c.richiedeCarta ? "richiede carta (Stripe)" : "attivazione istantanea, senza carta"}
                </p>
              </div>
              {c.redeemedAt ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  Usato da {c.studio?.name ?? "uno studio"} il {formatDate(c.redeemedAt)}
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Non ancora usato</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
