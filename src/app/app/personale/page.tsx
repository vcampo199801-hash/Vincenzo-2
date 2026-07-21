import Link from "next/link";
import { requirePersonaleAccess } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { logPersonaleAccess } from "@/lib/personale-access-log";
import { scadenzaPersonaleStato, comportoStato, optionLabel, TIPOLOGIA_ADEMPIMENTO_OPTIONS, COMPORTO_DISCLAIMER } from "@/lib/personale";
import { formatDate } from "@/lib/compliance";
import { StatCard } from "@/components/ui/stat-card";
import { StatoBadge } from "@/components/ui/badge";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function PersonalePage() {
  const { studio, session } = await requirePersonaleAccess();

  const [dipendenti, adempimenti, saldiCorrenti] = await Promise.all([
    prisma.dipendente.findMany({ where: { studioId: studio.id }, orderBy: [{ cognome: "asc" }, { nome: "asc" }] }),
    prisma.adempimentoPersonale.findMany({
      where: { studioId: studio.id },
      include: { dipendente: true },
    }),
    prisma.saldoAnnuale.findMany({
      where: { studioId: studio.id, anno: new Date().getFullYear() },
      include: { dipendente: true },
    }),
  ]);

  await logPersonaleAccess({ studioId: studio.id, userId: session.userId, azione: "VIEW_LISTA" });

  const dipendentiAttivi = dipendenti.filter((d) => d.stato === "ATTIVO");

  const scadenzeCompliance = adempimenti
    .map((a) => ({ a, ...scadenzaPersonaleStato(a.dataScadenza) }))
    .filter((s) => s.giorni !== null && s.stato !== "OK")
    .sort((x, y) => (x.giorni ?? 0) - (y.giorni ?? 0));

  const alertComporto = saldiCorrenti
    .map((s) => ({ s, stato: comportoStato(s.giorniMalattiaAnno, s.giorniComportoMassimo) }))
    .filter((r) => r.stato !== "OK");

  const oggi = new Date();
  const contrattiInScadenza = dipendenti
    .filter((d) => d.stato === "ATTIVO" && d.dataFineContratto)
    .map((d) => ({ d, ...scadenzaPersonaleStato(d.dataFineContratto) }))
    .filter((r) => r.giorni !== null && r.stato !== "OK");

  const provaInScadenza = dipendenti
    .filter((d) => d.stato === "ATTIVO" && d.finePeriodoProva && d.finePeriodoProva >= oggi)
    .map((d) => ({ d, ...scadenzaPersonaleStato(d.finePeriodoProva) }))
    .filter((r) => r.giorni !== null && r.stato !== "OK");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Gestione Personale</h1>
        <p className="mt-1 text-sm text-slate-500">
          Situazione aggiornata al {formatDate(new Date())} — visibile solo al titolare.
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p className="font-medium">⚠️ Dati particolari (art. 9 GDPR) e principio guida</p>
        <p className="mt-1">
          Questo modulo <strong>non sostituisce il consulente del lavoro</strong>: non calcola buste paga né
          contributi, registra solo dati inseriti manualmente o importati e genera promemoria di scadenza. Contiene
          dati sanitari (malattia, idoneità, vaccinazioni): ogni accesso viene registrato in un log interno.
          Ricordati di aggiornare il <Link href="/app/documenti" className="underline hover:text-amber-700">Registro dei Trattamenti (GDPR)</Link> dello
          studio includendo questo nuovo trattamento.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Dipendenti attivi" value={dipendentiAttivi.length} tone="good" />
        <StatCard label="Scadenze compliance" value={scadenzeCompliance.length} tone={scadenzeCompliance.length > 0 ? "warn" : "default"} />
        <StatCard label="Vicini al comporto" value={alertComporto.length} tone={alertComporto.length > 0 ? "bad" : "default"} />
        <StatCard
          label="Contratti/prova in scadenza"
          value={contrattiInScadenza.length + provaInScadenza.length}
          tone={contrattiInScadenza.length + provaInScadenza.length > 0 ? "warn" : "default"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Scadenze compliance (prossimi 90 giorni)</h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {scadenzeCompliance.map(({ a, giorni, stato }) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {a.dipendente.nome} {a.dipendente.cognome}
                  </p>
                  <p className="text-xs text-slate-500">
                    {optionLabel(TIPOLOGIA_ADEMPIMENTO_OPTIONS, a.tipologia)} · {giorni! < 0 ? `scaduto da ${Math.abs(giorni!)}gg` : `tra ${giorni} giorni`}
                  </p>
                </div>
                <StatoBadge stato={stato} />
              </li>
            ))}
            {scadenzeCompliance.length === 0 && <p className="py-4 text-sm text-slate-500">Nessuna scadenza nei prossimi 90 giorni.</p>}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Comporto malattia</h2>
          </div>
          <p className="mb-3 text-xs text-slate-500">{COMPORTO_DISCLAIMER}</p>
          <ul className="divide-y divide-slate-100">
            {alertComporto.map(({ s, stato }) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {s.dipendente.nome} {s.dipendente.cognome}
                  </p>
                  <p className="text-xs text-slate-500">
                    {s.giorniMalattiaAnno} / {s.giorniComportoMassimo} giorni usati
                  </p>
                </div>
                <StatoBadge stato={stato} />
              </li>
            ))}
            {alertComporto.length === 0 && <p className="py-4 text-sm text-slate-500">Nessun dipendente vicino al limite.</p>}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Contratti a termine in scadenza</h2>
          <ul className="divide-y divide-slate-100">
            {contrattiInScadenza.map(({ d, giorni, stato }) => (
              <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {d.nome} {d.cognome}
                  </p>
                  <p className="text-xs text-slate-500">{giorni! < 0 ? `scaduto da ${Math.abs(giorni!)}gg` : `tra ${giorni} giorni`}</p>
                </div>
                <StatoBadge stato={stato} />
              </li>
            ))}
            {contrattiInScadenza.length === 0 && <p className="py-4 text-sm text-slate-500">Nessun contratto a termine in scadenza.</p>}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Periodi di prova in scadenza</h2>
          <ul className="divide-y divide-slate-100">
            {provaInScadenza.map(({ d, giorni, stato }) => (
              <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {d.nome} {d.cognome}
                  </p>
                  <p className="text-xs text-slate-500">tra {giorni} giorni</p>
                </div>
                <StatoBadge stato={stato} />
              </li>
            ))}
            {provaInScadenza.length === 0 && <p className="py-4 text-sm text-slate-500">Nessun periodo di prova in scadenza.</p>}
          </ul>
        </section>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/app/personale/dipendenti"
          className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
        >
          Elenco dipendenti
        </Link>
        <Link
          href="/app/personale/calendario"
          className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Calendario assenze
        </Link>
      </div>
    </div>
  );
}
