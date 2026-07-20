import Link from "next/link";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { scadenzaStato, scortaStato, lottoStato, formatDate, formatCurrency } from "@/lib/compliance";
import { StatCard } from "@/components/ui/stat-card";
import { StatoBadge } from "@/components/ui/badge";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { studio } = await requireActiveSubscription();

  const [adempimenti, magazzino, farmaci, documenti] = await Promise.all([
    prisma.adempimento.findMany({ where: { studioId: studio.id } }),
    prisma.magazzinoItem.findMany({ where: { studioId: studio.id } }),
    prisma.farmaco.findMany({ where: { studioId: studio.id } }),
    prisma.documento.findMany({ where: { studioId: studio.id } }),
  ]);

  const scadenze = adempimenti.map((a) => ({ a, ...scadenzaStato(a.dataUltimoControllo, a.mesi) }));
  const okCount = scadenze.filter((s) => s.stato === "OK").length;
  const inScadenzaCount = scadenze.filter((s) => s.stato === "IN_SCADENZA").length;
  const scadutiCount = scadenze.filter((s) => s.stato === "SCADUTO").length;
  const daCompilareCount = scadenze.filter((s) => s.stato === "DA_COMPILARE").length;
  const compilati = scadenze.length - daCompilareCount;
  const compliancePct = compilati > 0 ? Math.round(((okCount) / compilati) * 100) : 0;

  const prossime5 = scadenze
    .filter((s) => s.giorni !== null)
    .sort((x, y) => (x.giorni ?? 0) - (y.giorni ?? 0))
    .slice(0, 5);

  const magazzinoRows = magazzino.map((m) => ({
    m,
    scorta: scortaStato(m.scortaMinima, m.quantitaAttuale),
    lotto: lottoStato(m.scadenzaLotto),
  }));
  const daRiordinare = magazzinoRows.filter((r) => r.scorta === "DA_RIORDINARE").length;
  const scortaBassa = magazzinoRows.filter((r) => r.scorta === "SCORTA_BASSA").length;
  const lottiCritici = magazzinoRows.filter((r) => r.lotto === "SCADUTO" || r.lotto === "IN_SCADENZA").length;
  const valoreGiacenze = magazzino.reduce((s, m) => s + m.quantitaAttuale * m.prezzoUnitario, 0);

  const farmaciRows = farmaci.map((f) => lottoStato(f.scadenza, 90));
  const farmaciScaduti = farmaciRows.filter((s) => s === "SCADUTO").length;
  const farmaciInScadenza = farmaciRows.filter((s) => s === "IN_SCADENZA").length;

  const documentiPresenti = documenti.filter((d) => d.stato === "PRESENTE").length;
  const documentiCompletezza = documenti.length > 0 ? Math.round((documentiPresenti / documenti.length) * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{studio.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Situazione aggiornata al {formatDate(new Date())} — il cruscotto si aggiorna da solo a ogni apertura.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label="In regola" value={okCount} tone="good" />
        <StatCard label="In scadenza" value={inScadenzaCount} tone="warn" />
        <StatCard label="Scaduti" value={scadutiCount} tone="bad" />
        <StatCard label="Da compilare" value={daCompilareCount} />
        <StatCard label="% Compliance" value={`${compliancePct}%`} tone={compliancePct >= 80 ? "good" : compliancePct >= 50 ? "warn" : "bad"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Le tue prossime 5 scadenze</h2>
            <Link href="/app/scadenzario" className="text-sm font-medium text-brand-600 hover:text-brand-800">
              Vedi tutte →
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {prossime5.map(({ a, prossimaScadenza, giorni, stato }) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{a.nome}</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(prossimaScadenza)} · {giorni} giorni
                  </p>
                </div>
                <StatoBadge stato={stato} />
              </li>
            ))}
            {prossime5.length === 0 && <p className="py-4 text-sm text-slate-500">Nessuna scadenza compilata ancora.</p>}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Magazzino in sintesi</h2>
            <Link href="/app/magazzino" className="text-sm font-medium text-brand-600 hover:text-brand-800">
              Vedi tutto →
            </Link>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <DashRow label="Articoli da riordinare" value={daRiordinare} bad={daRiordinare > 0} />
            <DashRow label="Articoli in scorta bassa" value={scortaBassa} bad={scortaBassa > 0} />
            <DashRow label="Lotti scaduti o in scadenza" value={lottiCritici} bad={lottiCritici > 0} />
            <DashRow label="Valore giacenze" value={formatCurrency(valoreGiacenze)} />
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Farmaci di emergenza</h2>
            <Link href="/app/farmaci" className="text-sm font-medium text-brand-600 hover:text-brand-800">
              Vedi tutto →
            </Link>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <DashRow label="Farmaci scaduti" value={farmaciScaduti} bad={farmaciScaduti > 0} />
            <DashRow label="In scadenza (90 giorni)" value={farmaciInScadenza} bad={farmaciInScadenza > 0} />
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Archivio documenti</h2>
            <Link href="/app/documenti" className="text-sm font-medium text-brand-600 hover:text-brand-800">
              Vedi tutto →
            </Link>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <DashRow label="Completezza documenti presenti" value={`${documentiCompletezza}%`} bad={documentiCompletezza < 50} />
            <DashRow label="Documenti censiti" value={documenti.length} />
          </dl>
        </section>
      </div>

      <p className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-800">
        Suggerimento: apri lo Scadenzario e aggiorna la data dell&apos;ultimo controllo dopo ogni intervento — il cruscotto si aggiorna da solo.
      </p>
    </div>
  );
}

function DashRow({ label, value, bad }: { label: string; value: string | number; bad?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={`text-lg font-semibold ${bad ? "text-red-600" : "text-slate-900"}`}>{value}</dd>
    </div>
  );
}
