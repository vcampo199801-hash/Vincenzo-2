import Image from "next/image";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { scadenzaStato, scortaStato, lottoStato, formatDate, formatCurrency, STATO_LABELS } from "@/lib/compliance";
import { PrintButton } from "@/components/app/print-button";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function ReportPage() {
  const { studio } = await requireActiveSubscription();

  const [adempimenti, magazzino, farmaci, documenti] = await Promise.all([
    prisma.adempimento.findMany({ where: { studioId: studio.id }, orderBy: { ordine: "asc" } }),
    prisma.magazzinoItem.findMany({ where: { studioId: studio.id }, orderBy: { prodotto: "asc" } }),
    prisma.farmaco.findMany({ where: { studioId: studio.id }, orderBy: { nome: "asc" } }),
    prisma.documento.findMany({ where: { studioId: studio.id }, orderBy: { ordine: "asc" } }),
  ]);

  const scadenze = adempimenti
    .map((a) => ({ a, ...scadenzaStato(a.dataUltimoControllo, a.mesi) }))
    .sort((x, y) => (x.giorni ?? Infinity) - (y.giorni ?? Infinity));

  const okCount = scadenze.filter((s) => s.stato === "OK").length;
  const inScadenzaCount = scadenze.filter((s) => s.stato === "IN_SCADENZA").length;
  const scadutiCount = scadenze.filter((s) => s.stato === "SCADUTO").length;
  const daCompilareCount = scadenze.filter((s) => s.stato === "DA_COMPILARE").length;
  const compilati = scadenze.length - daCompilareCount;
  const compliancePct = compilati > 0 ? Math.round((okCount / compilati) * 100) : 0;

  const magazzinoRows = magazzino.map((m) => ({
    m,
    scorta: scortaStato(m.scortaMinima, m.quantitaAttuale),
    lotto: lottoStato(m.scadenzaLotto),
  }));
  const valoreGiacenze = magazzino.reduce((s, m) => s + m.quantitaAttuale * m.prezzoUnitario, 0);

  const farmaciRows = farmaci.map((f) => ({ f, stato: lottoStato(f.scadenza, 90) }));

  const documentiPresenti = documenti.filter((d) => d.stato === "PRESENTE").length;
  const documentiPct = documenti.length > 0 ? Math.round((documentiPresenti / documenti.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="no-print mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Report compliance</h1>
          <p className="mt-1 text-sm text-slate-500">
            Riepilogo pronto da stampare o esportare in PDF — utile da mostrare a un ispettore ASL o da
            archiviare come prova di diligenza.
          </p>
        </div>
        <PrintButton />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none print:p-0">
        <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <Image src="/brand/monogram.png" alt="" width={40} height={40} className="h-10 w-10" />
            <div>
              <p className="text-lg font-semibold text-slate-900">{studio.name}</p>
              <p className="text-sm text-slate-500">
                {[studio.titolare, studio.citta].filter(Boolean).join(" · ") || "—"}
              </p>
            </div>
          </div>
          <div className="text-right text-sm text-slate-500">
            <p>Report generato il {formatDate(new Date())}</p>
            <p>Scadenze in Regola — by Sorrisi in Regola</p>
          </div>
        </div>

        <section className="mb-8">
          <h2 className="mb-3 text-base font-semibold text-slate-900">Sintesi compliance</h2>
          <div className="grid grid-cols-5 gap-3 text-center text-sm">
            <SummaryBox label="In regola" value={okCount} />
            <SummaryBox label="In scadenza" value={inScadenzaCount} />
            <SummaryBox label="Scaduti" value={scadutiCount} />
            <SummaryBox label="Da compilare" value={daCompilareCount} />
            <SummaryBox label="% Compliance" value={`${compliancePct}%`} />
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-base font-semibold text-slate-900">Scadenzario ({scadenze.length} adempimenti)</h2>
          <ReportTable
            headers={["Adempimento", "Ultimo controllo", "Prossima scadenza", "Stato"]}
            rows={scadenze.map(({ a, prossimaScadenza, stato }) => [
              a.nome,
              formatDate(a.dataUltimoControllo),
              formatDate(prossimaScadenza),
              STATO_LABELS[stato] ?? stato,
            ])}
          />
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-base font-semibold text-slate-900">
            Magazzino — valore giacenze: {formatCurrency(valoreGiacenze)}
          </h2>
          <ReportTable
            headers={["Prodotto", "Categoria", "Scorta min./attuale", "Stato scorta", "Scadenza lotto", "Stato lotto"]}
            rows={magazzinoRows.map(({ m, scorta, lotto }) => [
              m.prodotto,
              m.categoria,
              `${m.scortaMinima} / ${m.quantitaAttuale} ${m.unita}`,
              STATO_LABELS[scorta] ?? scorta,
              formatDate(m.scadenzaLotto),
              lotto ? STATO_LABELS[lotto] ?? lotto : "—",
            ])}
          />
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-base font-semibold text-slate-900">Farmaci di emergenza</h2>
          <ReportTable
            headers={["Farmaco / Presidio", "Lotto", "Scadenza", "Stato"]}
            rows={farmaciRows.map(({ f, stato }) => [f.nome, f.lotto ?? "—", formatDate(f.scadenza), stato ? STATO_LABELS[stato] ?? stato : "—"])}
          />
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-slate-900">
            Documenti dello studio — completezza {documentiPct}%
          </h2>
          <ReportTable
            headers={["Documento", "Stato"]}
            rows={documenti.map((d) => [d.nome, STATO_LABELS[d.stato] ?? d.stato])}
          />
        </section>

        <p className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-400">
          Documento generato automaticamente da Scadenze in Regola. È un supporto organizzativo e non sostituisce gli
          obblighi di verifica con i propri consulenti.
        </p>
      </div>
    </div>
  );
}

function SummaryBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <p className="text-xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function ReportTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-slate-300 text-left text-xs uppercase tracking-wide text-slate-500">
          {headers.map((h) => (
            <th key={h} className="py-2 pr-3">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-slate-100">
            {row.map((cell, j) => (
              <td key={j} className="py-2 pr-3 text-slate-700">
                {cell}
              </td>
            ))}
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan={headers.length} className="py-4 text-center text-slate-400">
              Nessun dato censito.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
