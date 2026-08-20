import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/compliance";
import { segnaRichiestaRisolta } from "@/lib/actions/admin-supporto";

export const dynamic = "force-dynamic";

export default async function AdminSupportoPage() {
  const richieste = await prisma.richiestaSupporto.findMany({
    include: { studio: true },
    orderBy: [{ risolta: "asc" }, { createdAt: "desc" }],
  });

  const aperte = richieste.filter((r) => !r.risolta);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-xl font-semibold text-slate-900">Richieste di supporto</h1>
      <p className="mt-1 text-sm text-slate-500">
        {aperte.length === 0 ? "Nessuna richiesta aperta." : `${aperte.length} richieste da leggere.`}
      </p>

      <div className="mt-6 space-y-3">
        {richieste.map((r) => (
          <div
            key={r.id}
            className={`rounded-xl border p-4 shadow-sm ${r.risolta ? "border-slate-200 bg-white opacity-60" : "border-amber-200 bg-amber-50"}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-slate-900">{r.studio.name}</p>
                <p className="text-xs text-slate-500">{r.daEmail} · {formatDate(r.createdAt)}</p>
              </div>
              <form action={segnaRichiestaRisolta.bind(null, r.id, !r.risolta)}>
                <button
                  type="submit"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  {r.risolta ? "Riapri" : "Segna risolta"}
                </button>
              </form>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{r.messaggio}</p>
          </div>
        ))}
        {richieste.length === 0 && <p className="text-sm text-slate-400">Non è ancora arrivata nessuna richiesta.</p>}
      </div>
    </div>
  );
}
