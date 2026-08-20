import { prisma } from "@/lib/prisma";
import { PIANI, normalizzaPiano } from "@/lib/plans";
import { formatDate, formatCurrency } from "@/lib/compliance";

// Pagina interna, non collegata a nessun menu: riservata al titolare della
// piattaforma (guardia in src/app/admin/layout.tsx) per avere sotto mano,
// una volta al mese, l'elenco di chi paga davvero e i dati per fatturare —
// non un registro storico dei pagamenti.
export const dynamic = "force-dynamic";

export default async function FatturazionePage() {
  const studi = await prisma.studio.findMany({
    where: { subscription: { status: "ACTIVE" } },
    include: { subscription: true },
    orderBy: { name: "asc" },
  });

  const righe = studi.map((s) => {
    const piano = PIANI[normalizzaPiano(s.subscription!.plan)];
    return { studio: s, piano };
  });
  const totale = righe.reduce((sum, r) => sum + r.piano.prezzoEuro, 0);
  const mancaDatiFatturazione = righe.filter((r) => !r.studio.partitaIva);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-xl font-semibold text-slate-900">Abbonati attivi da fatturare</h1>
      <p className="mt-1 text-sm text-slate-500">
        Istantanea di oggi ({formatDate(new Date())}): tutti gli studi con abbonamento attivo, con i dati per
        emettere la fattura elettronica mensile. Non è uno storico dei pagamenti passati — un abbonamento resta
        qui finché è attivo, ogni mese si rinnova allo stesso importo.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700">
          {righe.length} abbonati attivi
        </span>
        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
          Totale mensile: {formatCurrency(totale)}
        </span>
        {mancaDatiFatturazione.length > 0 && (
          <span className="rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700">
            {mancaDatiFatturazione.length} senza Partita IVA salvata
          </span>
        )}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Studio</th>
              <th className="px-4 py-3">Partita IVA</th>
              <th className="px-4 py-3">Codice Fiscale</th>
              <th className="px-4 py-3">PEC / SDI</th>
              <th className="px-4 py-3">Indirizzo</th>
              <th className="px-4 py-3">Piano</th>
              <th className="px-4 py-3">Importo/mese</th>
              <th className="px-4 py-3">Prossimo rinnovo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {righe.map(({ studio, piano }) => (
              <tr key={studio.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{studio.name}</p>
                  <p className="text-xs text-slate-400">{studio.email ?? "—"}</p>
                </td>
                <td className="px-4 py-3">
                  {studio.partitaIva ?? <span className="text-amber-600">mancante</span>}
                </td>
                <td className="px-4 py-3">{studio.codiceFiscale ?? "—"}</td>
                <td className="px-4 py-3">{studio.pec ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">
                  {[studio.indirizzo, studio.citta].filter(Boolean).join(", ") || "—"}
                </td>
                <td className="px-4 py-3">{piano.label}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{formatCurrency(piano.prezzoEuro)}</td>
                <td className="px-4 py-3 text-slate-600">
                  {studio.subscription?.currentPeriodEnd ? formatDate(studio.subscription.currentPeriodEnd) : "—"}
                  {studio.subscription?.cancelAtPeriodEnd && (
                    <span className="ml-1.5 text-xs text-red-600">(in cancellazione)</span>
                  )}
                </td>
              </tr>
            ))}
            {righe.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  Nessun abbonato attivo al momento.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
