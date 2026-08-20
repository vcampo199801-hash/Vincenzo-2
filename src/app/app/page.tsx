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
import { consegnaStato, contaStatiLavorazione, CATEGORIA_DICHIARAZIONE_CONFORMITA } from "@/lib/laboratori";
import {
  sommaKpi,
  tassoConversionePreventivi,
  fatturatoUltimiGiorni,
  toIsoDate,
  inizioMese,
  fineMese,
  inizioAnno,
  fineAnno,
  mesiTraDate,
  PERIODI_BILANCIO,
  type PeriodoBilancio,
} from "@/lib/kpi";
import {
  CATEGORIA_SPESA_OPTIONS,
  optionLabel as optionLabelSpesa,
  totaleSpese,
  sommaPerCategoria,
  speseEffettiveDelMese,
  speseDellAnno,
  costoAnnuoProiettato,
} from "@/lib/spese";
import { ultimoControlloPerTipo, contaAnomalie } from "@/lib/manutenzione";
import { normalizzaPiano } from "@/lib/plans";
import { DraggableSections } from "@/components/app/draggable-sections";
import { StatCard } from "@/components/ui/stat-card";
import { StatoBadge } from "@/components/ui/badge";
import { StatusDonut } from "@/components/charts/donut";
import { BarList } from "@/components/charts/bar-list";
import { Meter } from "@/components/charts/meter";
import { TrendBars } from "@/components/charts/trend-bars";
import { STATUS_HEX, BRAND_SEQUENTIAL } from "@/components/charts/colors";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ bilancio?: string; bilancioDa?: string; bilancioA?: string }>;
}) {
  const { studio } = await requireActiveSubscription("dashboard");
  const params = await searchParams;
  const pianoStudio = normalizzaPiano(studio.subscription?.plan);

  const [adempimenti, magazzino, farmaci, documenti, ecmCrediti, controlli, dipendenti, lavorazioniLab, kpiGiornalieri, materialiCount, spese, manutenzioni, tipiManutenzione, movimentiMagazzino] =
    await Promise.all([
      prisma.adempimento.findMany({ where: { studioId: studio.id } }),
      prisma.magazzinoItem.findMany({ where: { studioId: studio.id } }),
      prisma.farmaco.findMany({ where: { studioId: studio.id } }),
      prisma.documento.findMany({ where: { studioId: studio.id } }),
      prisma.ecmCredito.findMany({ where: { studioId: studio.id } }),
      prisma.controlloLog.findMany({ where: { studioId: studio.id } }),
      prisma.dipendente.findMany({ where: { studioId: studio.id } }),
      prisma.lavorazione.findMany({ where: { studioId: studio.id }, include: { allegati: true } }),
      prisma.kpiGiornaliero.findMany({ where: { studioId: studio.id } }),
      prisma.materialeInformativo.count({ where: { studioId: studio.id } }),
      prisma.spesaStudio.findMany({ where: { studioId: studio.id } }),
      prisma.manutenzioneLog.findMany({ where: { studioId: studio.id }, orderBy: { data: "desc" } }),
      prisma.tipoManutenzione.findMany({ where: { studioId: studio.id } }),
      prisma.movimentoMagazzino.findMany({ where: { studioId: studio.id } }),
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
  const statiLavorazioniLab = contaStatiLavorazione(lavorazioniLab);
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

  // KPI Studio: fatturato di oggi, riepilogo del mese corrente e andamento ultimi 7 giorni.
  const oggiIso = toIsoDate(now);
  const kpiOggi = kpiGiornalieri.find((k) => toIsoDate(k.data) === oggiIso);
  const kpiMeseCorrente = sommaKpi(kpiGiornalieri.filter((k) => k.data.getUTCFullYear() === now.getUTCFullYear() && k.data.getUTCMonth() === now.getUTCMonth()));
  const conversioneMeseKpi = tassoConversionePreventivi(kpiMeseCorrente.valorePreventiviPresentati, kpiMeseCorrente.valorePreventiviAccettati);
  const ultimi7Giorni = fatturatoUltimiGiorni(kpiGiornalieri, 7, now);

  // Spese: totale del mese/anno corrente e ripartizione per categoria del mese.
  const speseDelMeseCorrente = speseEffettiveDelMese(spese, now.getUTCFullYear(), now.getUTCMonth());
  const speseDellAnnoCorrente = speseDellAnno(spese, now.getUTCFullYear());
  const ripartizioneSpeseMese = sommaPerCategoria(speseDelMeseCorrente)
    .slice(0, 5)
    .map((s, i) => ({
      label: optionLabelSpesa(CATEGORIA_SPESA_OPTIONS, s.categoria),
      value: s.importo,
      color: BRAND_SEQUENTIAL[i % BRAND_SEQUENTIAL.length],
    }));

  // Manutenzione staff: quanti tipi di controllo sono in ritardo e anomalie totali.
  const manutenzionePerTipo = ultimoControlloPerTipo(manutenzioni, tipiManutenzione);
  const manutenzioneInRitardo = manutenzionePerTipo.filter((t) => t.inRitardo).length;
  const manutenzioneAnomalie = contaAnomalie(manutenzioni);

  // Bilancio dell'attività: confronta i ricavi del periodo scelto (fatturato
  // KPI) con la stima di tutti i costi dello stesso periodo raccolti
  // nell'app — spese del titolare (proiettate sulla loro cadenza), personale,
  // interventi del registro controlli e lavorazioni di laboratorio. Periodo
  // scelto rapidamente dallo studio: annuale, mensile o un intervallo
  // personalizzato.
  const anno = now.getUTCFullYear();
  const periodoBilancio: PeriodoBilancio = PERIODI_BILANCIO.some((p) => p.value === params.bilancio)
    ? (params.bilancio as PeriodoBilancio)
    : "annuale";
  const bilancioDaDefault = toIsoDate(inizioAnno(anno));
  const bilancioADefault = toIsoDate(now);
  const bilancioDaIso = params.bilancioDa || bilancioDaDefault;
  const bilancioAIso = params.bilancioA || bilancioADefault;

  let dataInizioBilancio: Date;
  let dataFineBilancio: Date;
  let titoloBilancio: string;
  if (periodoBilancio === "mensile") {
    dataInizioBilancio = inizioMese(anno, now.getUTCMonth());
    dataFineBilancio = fineMese(anno, now.getUTCMonth());
    titoloBilancio = `mese di ${MESI_LABELS[now.getUTCMonth()]} ${anno}`;
  } else if (periodoBilancio === "personalizzato") {
    dataInizioBilancio = new Date(bilancioDaIso);
    dataFineBilancio = new Date(bilancioAIso);
    titoloBilancio = `dal ${formatDate(dataInizioBilancio)} al ${formatDate(dataFineBilancio)}`;
  } else {
    dataInizioBilancio = inizioAnno(anno);
    dataFineBilancio = fineAnno(anno);
    titoloBilancio = `anno ${anno}`;
  }

  const ricaviPeriodo = kpiGiornalieri
    .filter((k) => k.data.getTime() >= dataInizioBilancio.getTime() && k.data.getTime() <= dataFineBilancio.getTime())
    .reduce((s, k) => s + k.fatturato, 0);

  let costoSpesePeriodo: number;
  let costoPersonalePeriodo: number;
  if (periodoBilancio === "annuale") {
    costoSpesePeriodo = costoAnnuoProiettato(spese, anno);
    costoPersonalePeriodo = costoMensileTotale * 12;
  } else {
    const mesiPeriodo = mesiTraDate(dataInizioBilancio, dataFineBilancio);
    costoSpesePeriodo = mesiPeriodo.reduce((s, { anno: a, mese: m }) => s + totaleSpese(speseEffettiveDelMese(spese, a, m)), 0);
    costoPersonalePeriodo = costoMensileTotale * mesiPeriodo.length;
  }
  const costoControlliPeriodo = controlli
    .filter((c) => c.dataIntervento.getTime() >= dataInizioBilancio.getTime() && c.dataIntervento.getTime() <= dataFineBilancio.getTime())
    .reduce((s, c) => s + c.costo, 0);
  const costoLaboratoriPeriodo = lavorazioniLab
    .filter((l) => l.dataInvio.getTime() >= dataInizioBilancio.getTime() && l.dataInvio.getTime() <= dataFineBilancio.getTime())
    .reduce((s, l) => s + (l.costo ?? 0), 0);
  const costoManutenzionePeriodo = manutenzioni
    .filter((m) => m.data.getTime() >= dataInizioBilancio.getTime() && m.data.getTime() <= dataFineBilancio.getTime())
    .reduce((s, m) => s + m.costo, 0);
  const costoMagazzinoPeriodo = studio.magazzinoInBilancio
    ? movimentiMagazzino
        .filter((m) => m.data.getTime() >= dataInizioBilancio.getTime() && m.data.getTime() <= dataFineBilancio.getTime())
        .reduce((s, m) => s + m.costo, 0)
    : 0;
  const costoPeriodoTotale =
    costoSpesePeriodo + costoPersonalePeriodo + costoControlliPeriodo + costoLaboratoriPeriodo + costoManutenzionePeriodo + costoMagazzinoPeriodo;
  const bilancioPeriodo = ricaviPeriodo - costoPeriodoTotale;
  const ripartizioneCosti = [
    { label: "Spese", value: costoSpesePeriodo },
    { label: "Personale", value: costoPersonalePeriodo },
    { label: "Registro controlli", value: costoControlliPeriodo },
    { label: "Laboratori", value: costoLaboratoriPeriodo },
    { label: "Manutenzione", value: costoManutenzionePeriodo },
    { label: "Magazzino", value: costoMagazzinoPeriodo },
  ]
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);

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

      <section className="min-w-0 rounded-xl border-2 border-brand-200 bg-white p-5 shadow-md">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900">Bilancio dell&apos;attività — {titoloBilancio}</h2>
              <Link href="/app/bilancio" className="text-sm font-medium text-brand-600 hover:text-brand-800">
                Vedi il bilancio completo →
              </Link>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Ricavi da KPI Studio meno la stima di tutti i costi del periodo (spese, personale, registro
              controlli, laboratori, manutenzione{studio.magazzinoInBilancio ? ", magazzino" : ""}). È una stima
              indicativa, non sostituisce la contabilità.
              {!studio.magazzinoInBilancio && (
                <>
                  {" "}
                  Il Magazzino non è incluso — puoi attivarlo dalla{" "}
                  <Link href="/app/magazzino" className="underline hover:text-slate-700">pagina Magazzino</Link>.
                </>
              )}
            </p>
            {pianoStudio === "BASE" && (
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Bilancio parziale: il piano Base non include Spese, Personale e Manutenzione.{" "}
                <Link href="/app/abbonamento" className="font-medium underline">Passa a Plus</Link> per il quadro
                completo.
              </p>
            )}
          </div>
          <span className={`shrink-0 text-2xl font-bold ${bilancioPeriodo >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {bilancioPeriodo >= 0 ? "+" : ""}
            {formatCurrency(bilancioPeriodo)}
          </span>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {PERIODI_BILANCIO.map((p) => (
            <Link
              key={p.value}
              href={`/app?bilancio=${p.value}`}
              scroll={false}
              className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium ${
                periodoBilancio === p.value ? "bg-brand-600 text-white" : "border border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {p.label}
            </Link>
          ))}
          {periodoBilancio === "personalizzato" && (
            <form method="get" className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="bilancio" value="personalizzato" />
              <input
                type="date"
                name="bilancioDa"
                defaultValue={bilancioDaIso}
                className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
              />
              <span className="text-sm text-slate-400">—</span>
              <input
                type="date"
                name="bilancioA"
                defaultValue={bilancioAIso}
                className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
              />
              <button type="submit" className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200">
                Applica
              </button>
            </form>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <DashRow label="Ricavi del periodo (fatturato KPI)" value={formatCurrency(ricaviPeriodo)} />
            <DashRow label="Costi totali stimati" value={formatCurrency(costoPeriodoTotale)} bad={costoPeriodoTotale > ricaviPeriodo} />
          </dl>
          {ripartizioneCosti.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Ripartizione dei costi</p>
              <BarList items={ripartizioneCosti} formatValue={formatCurrency} />
            </div>
          ) : (
            <p className="text-sm text-slate-500">Aggiungi spese, personale, interventi o lavorazioni per vedere la ripartizione dei costi.</p>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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

      <DraggableSections
        studioId={studio.id}
        sections={[
          {
            key: "scadenzario-stato",
            node: (
              <section key="scadenzario-stato" className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
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
            ),
          },
          {
            key: "magazzino-categoria",
            node: (
              <section key="magazzino-categoria" className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-900">Valore magazzino per categoria</h2>
                  <Link href="/app/magazzino" className="text-sm font-medium text-brand-600 hover:text-brand-800">
                    Vedi tutto →
                  </Link>
                </div>
                <BarList items={categorieRanked} formatValue={formatCurrency} />
              </section>
            ),
          },
          {
            key: "controlli-spesa",
            node: (
              <section key="controlli-spesa" className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-900">Spesa manutenzioni — ultimi 6 mesi</h2>
                  <Link href="/app/controlli" className="text-sm font-medium text-brand-600 hover:text-brand-800">
                    Vedi tutto →
                  </Link>
                </div>
                <TrendBars items={speseUltimiMesi} formatValue={(v) => formatCurrency(v).replace(",00", "")} />
              </section>
            ),
          },
          {
            key: "ecm",
            node: (
              <section key="ecm" className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
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
            ),
          },
          {
            key: "kpi",
            node: (
              <Link
                key="kpi"
                href="/app/kpi"
                className="min-w-0 block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-brand-300"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-900">KPI Studio</h2>
                  <span className="text-sm font-medium text-brand-600">Vedi tutto →</span>
                </div>
                <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
                  <DashRow label="Fatturato di oggi" value={formatCurrency(kpiOggi?.fatturato ?? 0)} />
                  <DashRow label="Fatturato questo mese" value={formatCurrency(kpiMeseCorrente.fatturato)} />
                  <DashRow label="Prime visite questo mese" value={kpiMeseCorrente.numeroPrimeVisite} />
                  <DashRow label="Conversione preventivi" value={conversioneMeseKpi === null ? "—" : `${conversioneMeseKpi}%`} />
                </div>
                <div className="border-t border-slate-100 pt-4">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">Fatturato ultimi 7 giorni</p>
                  <TrendBars items={ultimi7Giorni} formatValue={formatCurrency} barAreaHeight={64} />
                </div>
              </Link>
            ),
          },
          {
            key: "personale",
            node: (
              <section key="personale" className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
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
            ),
          },
          {
            key: "laboratori",
            node: (
              <Link
                key="laboratori"
                href="/app/laboratori"
                className="min-w-0 block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-brand-300"
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
                  <DashRow label="In attesa dal laboratorio" value={statiLavorazioniLab.inAttesa} />
                  <DashRow label="In lavorazione" value={statiLavorazioniLab.inLavorazione} />
                  <DashRow label="Arrivati" value={statiLavorazioniLab.arrivati} />
                  <DashRow label="Consegne previste nei prossimi 7gg" value={consegneImminentiCount} bad={consegneImminentiCount > 0} />
                  <DashRow label="Dichiarazioni mancanti" value={dichiarazioniMancantiCount} bad={dichiarazioniMancantiCount > 0} />
                  <DashRow label="Spesa laboratori questo mese" value={formatCurrency(spesaMeseCorrente)} />
                </dl>
              </Link>
            ),
          },
          ...(farmaci.length > 0
            ? [
                {
                  key: "farmaci",
                  node: (
                    <section key="farmaci" className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
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
                  ),
                },
              ]
            : []),
          {
            key: "documenti",
            node: (
              <section key="documenti" className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
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
            ),
          },
          {
            key: "comunicazione",
            node: (
              <Link
                key="comunicazione"
                href="/app/comunicazione"
                className="min-w-0 block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-brand-300"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-900">Comunicazione Pazienti</h2>
                  <span className="text-sm font-medium text-brand-600">Vedi tutto →</span>
                </div>
                <p className="text-sm text-slate-600">
                  {materialiCount} material{materialiCount === 1 ? "e" : "i"} informativ{materialiCount === 1 ? "o" : "i"} per i
                  pazienti, pronti da mostrare in studio o condividere con un link.
                </p>
              </Link>
            ),
          },
          {
            key: "spese",
            node: (
              <section key="spese" className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-900">Spese</h2>
                  <Link href="/app/spese" className="text-sm font-medium text-brand-600 hover:text-brand-800">
                    Vedi tutto →
                  </Link>
                </div>
                <dl className="mb-4 grid grid-cols-2 gap-4 text-sm">
                  <DashRow label="Spese questo mese" value={formatCurrency(totaleSpese(speseDelMeseCorrente))} />
                  <DashRow label="Spese quest'anno" value={formatCurrency(totaleSpese(speseDellAnnoCorrente))} />
                </dl>
                {ripartizioneSpeseMese.length > 0 ? (
                  <div className="border-t border-slate-100 pt-4">
                    <StatusDonut segments={ripartizioneSpeseMese} formatValue={formatCurrency} size={112} strokeWidth={16} />
                  </div>
                ) : (
                  <p className="border-t border-slate-100 pt-4 text-sm text-slate-500">
                    Aggiungi le tue voci di spesa (affitto, utenze...) per vedere il riepilogo qui.
                  </p>
                )}
              </section>
            ),
          },
          {
            key: "manutenzione-staff",
            node: (
              <Link
                key="manutenzione-staff"
                href="/app/manutenzione"
                className="min-w-0 block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-brand-300"
              >
                <div className="mb-4 flex items-center gap-2">
                  <h2 className="text-base font-semibold text-slate-900">Manutenzione staff</h2>
                  {(manutenzioneInRitardo > 0 || manutenzioneAnomalie > 0) && (
                    <span className="inline-flex items-center rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                      {manutenzioneInRitardo + manutenzioneAnomalie}
                    </span>
                  )}
                </div>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <DashRow label="Tipi di controllo in ritardo" value={manutenzioneInRitardo} bad={manutenzioneInRitardo > 0} />
                  <DashRow label="Anomalie riscontrate" value={manutenzioneAnomalie} bad={manutenzioneAnomalie > 0} />
                </dl>
              </Link>
            ),
          },
        ]}
      />

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
