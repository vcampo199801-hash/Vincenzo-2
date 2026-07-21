import Link from "next/link";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import {
  scadenzaStato,
  scortaStato,
  lottoStato,
  ecmPercent,
  formatDate,
  formatCurrency,
  STATO_LABELS,
  MESI_LABELS,
} from "@/lib/compliance";
import { contrattoStato, optionLabel, MANSIONE_OPTIONS } from "@/lib/personale";
import { consegnaStato, CATEGORIA_DICHIARAZIONE_CONFORMITA } from "@/lib/laboratori";
import { StatCard } from "@/components/ui/stat-card";
import { StatoBadge } from "@/components/ui/badge";
import { StatusDonut } from "@/components/charts/donut";
import { BarList } from "@/components/charts/bar-list";
import { Meter } from "@/components/charts/meter";
import { TrendBars } from "@/components/charts/trend-bars";
import { STATUS_HEX, BRAND_SEQUENTIAL } from "@/components/charts/colors";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { studio } = await requireActiveSubscription("dashboard");

  const [adempimenti, magazzino, farmaci, documenti, ecmCrediti, controlli, dipendenti, lavorazioniLab] = await Promise.all([
    prisma.adempimento.findMany({ where: { studioId: studio.id } }),
    prisma.magazzinoItem.findMany({ where: { studioId: studio.id } }),
    prisma.farmaco.findMany({ where: { studioId: studio.id } }),
    prisma.documento.findMany({ where: { studioId: studio.id } }),
    prisma.ecmCredito.findMany({ where: { studioId: studio.id } }),
    prisma.controlloLog.findMany({ where: { studioId: studio.id } }),
    prisma.dipendente.findMany({ where: { studioId: studio.id } }),
    prisma.lavorazione.findMany({ where: { studioId: studio.id }, include: { allegati: true } }),
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

  // Magazzino: valore giacenze per categoria, le prime 6 per valore.
  const valorePerCategoria = new Map<string, number>();
  for (const m of magazzino) {
    valorePerCategoria.set(m.categoria, (valorePerCategoria.get(m.categoria) ?? 0) + m.quantitaAttuale * m.prezzoUnitario);
  }
  const categorieRanked = [...valorePerCategoria.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Registro controlli: spesa per mese, ultimi 6 mesi (compresi i mesi senza interventi).
  const now = new Date();
  const speseUltimiMesi = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const value = controlli
      .filter((c) => c.dataIntervento.getFullYear() === d.getFullYear() && c.dataIntervento.getMonth() === d.getMonth())
      .reduce((sum, c) => sum + c.costo, 0);
    return { label: MESI_LABELS[d.getMonth()].slice(0, 3), value };
  });

  // Formazione ECM: chi ha più strada da fare verso il target, in cima.
  const ecmRanked = ecmCrediti
    .map((e) => ({ e, ...ecmPercent(e.crediti2026, e.crediti2027, e.crediti2028, e.target) }))
    .sort((a, b) => a.percentuale - b.percentuale)
    .slice(0, 5);
  const ecmTotali = ecmCrediti.reduce(
    (acc, e) => {
      acc.totale += e.crediti2026 + e.crediti2027 + e.crediti2028;
      acc.target += e.target;
      return acc;
    },
    { totale: 0, target: 0 }
  );

  const farmaciOk = farmaciRows.filter((s) => s === "OK").length;

  // Personale: costo aziendale mensile/annuo e scadenze contrattuali imminenti,
  // solo sui dipendenti attivi. Nessun calcolo di ferie/contributi/TFR qui.
  const dipendentiAttivi = dipendenti.filter((d) => d.stato === "ATTIVO");
  const costoMensileTotale = dipendentiAttivi.reduce((s, d) => s + (d.costoAziendaleMensile ?? 0), 0);
  const scadenzeContrattualiImminenti = dipendentiAttivi.filter((d) => {
    const { stato } = contrattoStato(d.dataScadenzaContratto);
    return d.dataScadenzaContratto !== null && (stato === "IN_SCADENZA" || stato === "SCADUTO");
  }).length;
  const costoPerMansione = new Map<string, number>();
  for (const d of dipendentiAttivi) {
    costoPerMansione.set(d.mansione, (costoPerMansione.get(d.mansione) ?? 0) + (d.costoAziendaleMensile ?? 0));
  }
  const costoPerMansioneRanked = [...costoPerMansione.entries()]
    .filter(([, value]) => value > 0)
    .map(([mansione, value], i) => ({
      label: optionLabel(MANSIONE_OPTIONS, mansione),
      value,
      color: BRAND_SEQUENTIAL[i % BRAND_SEQUENTIAL.length],
    }))
    .sort((a, b) => b.value - a.value);

  // Laboratori: lavorazioni in corso, consegne imminenti, dichiarazioni di
  // conformità mancanti e spesa del mese corrente (per data di invio).
  const lavorazioniInCorso = lavorazioniLab.filter((l) => l.stato === "INVIATO" || l.stato === "IN_LAVORAZIONE").length;
  const consegneImminentiCount = lavorazioniLab.filter((l) => {
    const { stato } = consegnaStato(l.dataConsegnaPrevista, l.dataConsegnaEffettiva);
    return stato === "IN_SCADENZA" || stato === "SCADUTO";
  }).length;
  const dichiarazioniMancantiCount = lavorazioniLab.filter(
    (l) =>
      (l.stato === "CONSEGNATO_STUDIO" || l.stato === "CONSEGNATO_PAZIENTE") &&
      !l.allegati.some((a) => a.categoria === CATEGORIA_DICHIARAZIONE_CONFORMITA)
  ).length;
  const oggiLab = new Date();
  const spesaMeseCorrente = lavorazioniLab
    .filter((l) => l.dataInvio.getFullYear() === oggiLab.getFullYear() && l.dataInvio.getMonth() === oggiLab.getMonth())
    .reduce((s, l) => s + (l.costo ?? 0), 0);

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
        <section className="min-w-0 rounded-xl border-2 border-brand-200 bg-white p-5 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Le tue prossime 5 scadenze</h2>
            <Link href="/app/scadenzario" className="text-sm font-medium text-brand-600 hover:text-brand-800">
              Vedi tutte →
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {prossime5.map(({ a, prossimaScadenza, giorni, stato }) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-3">
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

        <section className="min-w-0 rounded-xl border-2 border-brand-200 bg-white p-5 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Magazzino in sintesi</h2>
            <Link href="/app/magazzino" className="text-sm font-medium text-brand-600 hover:text-brand-800">
              Vedi tutto →
            </Link>
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <DashRow label="Articoli da riordinare" value={daRiordinare} bad={daRiordinare > 0} />
            <DashRow label="Articoli in scorta bassa" value={scortaBassa} bad={scortaBassa > 0} />
            <DashRow label="Lotti scaduti o in scadenza" value={lottiCritici} bad={lottiCritici > 0} />
            <DashRow label="Valore giacenze" value={formatCurrency(valoreGiacenze)} />
          </dl>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Scadenzario per stato</h2>
          <StatusDonut
            centerValue={`${compliancePct}%`}
            centerLabel="in regola"
            segments={[
              { label: STATO_LABELS.OK, value: okCount, color: STATUS_HEX.OK },
              { label: STATO_LABELS.IN_SCADENZA, value: inScadenzaCount, color: STATUS_HEX.IN_SCADENZA },
              { label: STATO_LABELS.SCADUTO, value: scadutiCount, color: STATUS_HEX.SCADUTO },
              { label: STATO_LABELS.DA_COMPILARE, value: daCompilareCount, color: STATUS_HEX.DA_COMPILARE },
            ]}
          />
        </section>

        <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Valore magazzino per categoria</h2>
            <Link href="/app/magazzino" className="text-sm font-medium text-brand-600 hover:text-brand-800">
              Vedi tutto →
            </Link>
          </div>
          <BarList items={categorieRanked} formatValue={formatCurrency} />
        </section>

        <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Spesa manutenzioni — ultimi 6 mesi</h2>
            <Link href="/app/controlli" className="text-sm font-medium text-brand-600 hover:text-brand-800">
              Vedi tutto →
            </Link>
          </div>
          <TrendBars items={speseUltimiMesi} formatValue={(v) => formatCurrency(v).replace(",00", "")} />
        </section>

        <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Formazione ECM del team</h2>
            <Link href="/app/ecm" className="text-sm font-medium text-brand-600 hover:text-brand-800">
              Vedi tutto →
            </Link>
          </div>
          <div className="space-y-3">
            <Meter
              label="Crediti totali team vs target"
              value={ecmTotali.totale}
              max={ecmTotali.target}
              tone={ecmTotali.totale >= ecmTotali.target ? "good" : ecmTotali.totale >= ecmTotali.target * 0.6 ? "warn" : "bad"}
            />
            {ecmRanked.length > 0 && (
              <div className="space-y-2.5 border-t border-slate-100 pt-3">
                {ecmRanked.map(({ e, percentuale }) => (
                  <Meter
                    key={e.id}
                    label={e.professionista}
                    value={Math.round(percentuale * 100)}
                    max={100}
                    tone={percentuale >= 1 ? "good" : percentuale >= 0.6 ? "warn" : "bad"}
                  />
                ))}
              </div>
            )}
            {ecmCrediti.length === 0 && <p className="text-sm text-slate-500">Nessun professionista censito.</p>}
          </div>
        </section>

        <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900">Personale</h2>
              {scadenzeContrattualiImminenti > 0 && (
                <span className="inline-flex items-center rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                  {scadenzeContrattualiImminenti}
                </span>
              )}
            </div>
            <Link href="/app/personale" className="text-sm font-medium text-brand-600 hover:text-brand-800">
              Vedi tutto →
            </Link>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
            <DashRow label="Dipendenti attivi" value={dipendentiAttivi.length} />
            <DashRow label="Scadenze contrattuali imminenti" value={scadenzeContrattualiImminenti} bad={scadenzeContrattualiImminenti > 0} />
            <DashRow label="Costo aziendale mensile" value={formatCurrency(costoMensileTotale)} />
            <DashRow label="Costo aziendale annuo (stimato)" value={formatCurrency(costoMensileTotale * 12)} />
          </div>
          {costoPerMansioneRanked.length > 0 ? (
            <div className="border-t border-slate-100 pt-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">Costo per mansione</p>
              <StatusDonut segments={costoPerMansioneRanked} formatValue={formatCurrency} />
            </div>
          ) : (
            <p className="border-t border-slate-100 pt-4 text-sm text-slate-500">
              Aggiungi il costo aziendale mensile ai dipendenti per vedere la ripartizione.
            </p>
          )}
        </section>

        <Link
          href="/app/laboratori"
          className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-brand-300"
        >
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">Laboratori</h2>
            {dichiarazioniMancantiCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                {dichiarazioniMancantiCount}
              </span>
            )}
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <DashRow label="Lavorazioni in corso" value={lavorazioniInCorso} />
            <DashRow label="Consegne previste nei prossimi 7gg" value={consegneImminentiCount} bad={consegneImminentiCount > 0} />
            <DashRow label="Dichiarazioni mancanti" value={dichiarazioniMancantiCount} bad={dichiarazioniMancantiCount > 0} />
            <DashRow label="Spesa laboratori questo mese" value={formatCurrency(spesaMeseCorrente)} />
          </dl>
        </Link>

        {farmaci.length > 0 && (
          <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Farmaci di emergenza per stato</h2>
              <Link href="/app/farmaci" className="text-sm font-medium text-brand-600 hover:text-brand-800">
                Vedi tutto →
              </Link>
            </div>
            <StatusDonut
              centerValue={String(farmaci.length)}
              centerLabel="totali"
              segments={[
                { label: "In regola", value: farmaciOk, color: STATUS_HEX.OK },
                { label: "In scadenza", value: farmaciInScadenza, color: STATUS_HEX.IN_SCADENZA },
                { label: "Scaduti", value: farmaciScaduti, color: STATUS_HEX.SCADUTO },
              ]}
            />
          </section>
        )}

        <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Archivio documenti — completezza</h2>
            <Link href="/app/documenti" className="text-sm font-medium text-brand-600 hover:text-brand-800">
              Vedi tutto →
            </Link>
          </div>
          <Meter
            label={`${documenti.length} documenti censiti`}
            value={documentiPresenti}
            max={documenti.length}
            tone={documentiCompletezza >= 80 ? "good" : documentiCompletezza >= 50 ? "warn" : "bad"}
          />
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
