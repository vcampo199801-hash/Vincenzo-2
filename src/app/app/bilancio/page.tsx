import Link from "next/link";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, MESI_LABELS } from "@/lib/compliance";
import {
  toIsoDate,
  inizioMese,
  fineMese,
  inizioAnno,
  fineAnno,
  mesiTraDate,
  PERIODI_BILANCIO,
  type PeriodoBilancio,
} from "@/lib/kpi";
import { spesaAttivaNelMese, costoAnnuoRiga, optionLabel as optionLabelSpesa, CATEGORIA_SPESA_OPTIONS } from "@/lib/spese";
import { normalizzaPiano, pianoConsenteModulo } from "@/lib/plans";
import { PageHeader } from "@/components/ui/page-header";
import { TableScroll } from "@/components/ui/table-scroll";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

type Riga = { href?: string; label: string; sub?: string; importo: number };

export default async function BilancioPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; da?: string; a?: string }>;
}) {
  const { studio, subscription } = await requireActiveSubscription("bilancio");
  const piano = normalizzaPiano(subscription.plan);
  const params = await searchParams;

  const [spese, dipendenti, controlli, lavorazioniLab, manutenzioni, tipiManutenzione, movimentiMagazzino, kpiGiornalieri] =
    await Promise.all([
      prisma.spesaStudio.findMany({ where: { studioId: studio.id } }),
      prisma.dipendente.findMany({ where: { studioId: studio.id, stato: "ATTIVO" } }),
      prisma.controlloLog.findMany({ where: { studioId: studio.id } }),
      prisma.lavorazione.findMany({ where: { studioId: studio.id }, include: { laboratorio: true } }),
      prisma.manutenzioneLog.findMany({ where: { studioId: studio.id } }),
      prisma.tipoManutenzione.findMany({ where: { studioId: studio.id } }),
      prisma.movimentoMagazzino.findMany({ where: { studioId: studio.id }, include: { magazzinoItem: true } }),
      prisma.kpiGiornaliero.findMany({ where: { studioId: studio.id } }),
    ]);

  const now = new Date();
  const anno = now.getUTCFullYear();
  const periodo: PeriodoBilancio = PERIODI_BILANCIO.some((p) => p.value === params.periodo)
    ? (params.periodo as PeriodoBilancio)
    : "annuale";
  const daDefault = toIsoDate(inizioAnno(anno));
  const aDefault = toIsoDate(now);
  const daIso = params.da || daDefault;
  const aIso = params.a || aDefault;

  let dataInizio: Date;
  let dataFine: Date;
  let titolo: string;
  if (periodo === "mensile") {
    dataInizio = inizioMese(anno, now.getUTCMonth());
    dataFine = fineMese(anno, now.getUTCMonth());
    titolo = `mese di ${MESI_LABELS[now.getUTCMonth()]} ${anno}`;
  } else if (periodo === "personalizzato") {
    dataInizio = new Date(daIso);
    dataFine = new Date(aIso);
    titolo = `dal ${formatDate(dataInizio)} al ${formatDate(dataFine)}`;
  } else {
    dataInizio = inizioAnno(anno);
    dataFine = fineAnno(anno);
    titolo = `anno ${anno}`;
  }
  const mesiPeriodo = mesiTraDate(dataInizio, dataFine);
  const nelPeriodo = (d: Date) => d.getTime() >= dataInizio.getTime() && d.getTime() <= dataFine.getTime();

  const ricaviPeriodo = kpiGiornalieri.filter((k) => nelPeriodo(k.data)).reduce((s, k) => s + k.fatturato, 0);

  // ---------- Registro controlli (sempre incluso, in ogni piano) ----------
  const controlliInPeriodo = controlli.filter((c) => nelPeriodo(c.dataIntervento));
  const righeControlli: Riga[] = controlliInPeriodo
    .filter((c) => c.costo > 0)
    .map((c) => ({
      href: `/app/controlli/${c.id}/edit`,
      label: c.tecnico ? `Intervento — ${c.tecnico}` : "Intervento",
      sub: formatDate(c.dataIntervento),
      importo: c.costo,
    }))
    .sort((a, b) => b.importo - a.importo);
  const costoControlli = righeControlli.reduce((s, r) => s + r.importo, 0);

  // ---------- Spese (piano Plus+) ----------
  const speseLocked = !pianoConsenteModulo(subscription.plan, "spese");
  function contributoSpesa(r: (typeof spese)[number]): number {
    if (periodo === "annuale") return costoAnnuoRiga(r, anno);
    return mesiPeriodo.reduce((s, { anno: a, mese: m }) => s + (spesaAttivaNelMese(r, a, m) ? r.importo : 0), 0);
  }
  const righeSpese: Riga[] = speseLocked
    ? []
    : spese
        .map((r) => ({
          href: `/app/spese/${r.id}/edit`,
          label: r.descrizione || optionLabelSpesa(CATEGORIA_SPESA_OPTIONS, r.categoria),
          sub: optionLabelSpesa(CATEGORIA_SPESA_OPTIONS, r.categoria),
          importo: contributoSpesa(r),
        }))
        .filter((r) => r.importo > 0)
        .sort((a, b) => b.importo - a.importo);
  const costoSpese = righeSpese.reduce((s, r) => s + r.importo, 0);

  // ---------- Personale (piano Plus+) ----------
  const personaleLocked = !pianoConsenteModulo(subscription.plan, "personale");
  const righePersonale: Riga[] = personaleLocked
    ? []
    : dipendenti
        .filter((d) => (d.costoAziendaleMensile ?? 0) > 0)
        .map((d) => ({
          href: `/app/personale/${d.id}`,
          label: `${d.nome} ${d.cognome}`,
          sub: "Costo aziendale mensile",
          importo: (d.costoAziendaleMensile ?? 0) * mesiPeriodo.length,
        }))
        .sort((a, b) => b.importo - a.importo);
  const costoPersonale = righePersonale.reduce((s, r) => s + r.importo, 0);

  // ---------- Manutenzione staff (piano Plus+) ----------
  const manutenzioneLocked = !pianoConsenteModulo(subscription.plan, "manutenzione");
  const nomiTipoManutenzione = new Map(tipiManutenzione.map((t) => [t.chiave, t.nome]));
  const righeManutenzione: Riga[] = manutenzioneLocked
    ? []
    : manutenzioni
        .filter((m) => nelPeriodo(m.data) && m.costo > 0)
        .map((m) => ({
          href: "/app/manutenzione",
          label: nomiTipoManutenzione.get(m.tipo) ?? m.tipo,
          sub: `${formatDate(m.data)} · ${m.operatore}`,
          importo: m.costo,
        }))
        .sort((a, b) => b.importo - a.importo);
  const costoManutenzione = righeManutenzione.reduce((s, r) => s + r.importo, 0);

  // ---------- Laboratori odontotecnici (piano Completo) ----------
  const laboratoriLocked = !pianoConsenteModulo(subscription.plan, "laboratori");
  const righeLaboratori: Riga[] = laboratoriLocked
    ? []
    : lavorazioniLab
        .filter((l) => nelPeriodo(l.dataInvio) && (l.costo ?? 0) > 0)
        .map((l) => ({
          href: `/app/laboratori/lavorazioni/${l.id}`,
          label: l.riferimentoPaziente,
          sub: l.laboratorio.ragioneSociale,
          importo: l.costo ?? 0,
        }))
        .sort((a, b) => b.importo - a.importo);
  const costoLaboratori = righeLaboratori.reduce((s, r) => s + r.importo, 0);

  // ---------- Magazzino (facoltativo, solo se lo studio lo include nel bilancio) ----------
  const movimentiInPeriodo = movimentiMagazzino.filter((m) => nelPeriodo(m.data) && m.costo > 0);
  const righeMagazzino: Riga[] = !studio.magazzinoInBilancio
    ? []
    : movimentiInPeriodo
        .map((m) => ({
          href: "/app/magazzino",
          label: m.magazzinoItem.prodotto,
          sub: formatDate(m.data),
          importo: m.costo,
        }))
        .sort((a, b) => b.importo - a.importo);
  const costoMagazzino = righeMagazzino.reduce((s, r) => s + r.importo, 0);
  const valoreMagazzinoNonIncluso = !studio.magazzinoInBilancio
    ? movimentiInPeriodo.reduce((s, m) => s + m.costo, 0)
    : 0;

  const costoTotale = costoSpese + costoPersonale + costoControlli + costoLaboratori + costoManutenzione + costoMagazzino;
  const bilancioPeriodo = ricaviPeriodo - costoTotale;

  const categorie = [
    {
      key: "controlli",
      label: "Registro controlli",
      icon: "🛠️",
      locked: false,
      righe: righeControlli,
      totale: costoControlli,
    },
    { key: "spese", label: "Spese", icon: "💶", locked: speseLocked, righe: righeSpese, totale: costoSpese },
    {
      key: "personale",
      label: "Personale",
      icon: "🧑‍⚕️",
      locked: personaleLocked,
      righe: righePersonale,
      totale: costoPersonale,
    },
    {
      key: "manutenzione",
      label: "Manutenzione staff",
      icon: "🧯",
      locked: manutenzioneLocked,
      righe: righeManutenzione,
      totale: costoManutenzione,
    },
    {
      key: "laboratori",
      label: "Laboratori odontotecnici",
      icon: "🧪",
      locked: laboratoriLocked,
      righe: righeLaboratori,
      totale: costoLaboratori,
    },
    ...(studio.magazzinoInBilancio || movimentiInPeriodo.length > 0
      ? [{ key: "magazzino", label: "Magazzino", icon: "📦", locked: false, righe: righeMagazzino, totale: costoMagazzino }]
      : []),
  ];

  const ripartizione = categorie.filter((c) => !c.locked && c.totale > 0).sort((a, b) => b.totale - a.totale);

  // ---------- Consigli e appunti: solo regole semplici sui dati già calcolati, nessuna chiamata esterna ----------
  const consigli: { tone: "bad" | "warn" | "info" | "good"; testo: string }[] = [];
  if (costoTotale > 0 && ricaviPeriodo < costoTotale) {
    consigli.push({
      tone: "bad",
      testo: `Il bilancio del periodo è in perdita di ${formatCurrency(costoTotale - ricaviPeriodo)}: i costi superano i ricavi registrati.`,
    });
  }
  if (ripartizione[0] && costoTotale > 0) {
    const pct = Math.round((ripartizione[0].totale / costoTotale) * 100);
    if (pct >= 40) {
      consigli.push({
        tone: "warn",
        testo: `La voce "${ripartizione[0].label}" pesa da sola per il ${pct}% dei costi del periodo (${formatCurrency(
          ripartizione[0].totale
        )}): potrebbe valere la pena rivederla o rinegoziarla.`,
      });
    }
  }
  if (ricaviPeriodo === 0) {
    consigli.push({
      tone: "warn",
      testo: "Non risultano ricavi registrati in questo periodo: apri KPI Studio e inserisci il fatturato giornaliero per un bilancio più accurato.",
    });
  }
  if (valoreMagazzinoNonIncluso > 0) {
    consigli.push({
      tone: "info",
      testo: `Il Magazzino non è incluso nel bilancio: nel periodo risultano ${formatCurrency(valoreMagazzinoNonIncluso)} di riordini non conteggiati. Puoi attivarlo dalla pagina Magazzino.`,
    });
  }
  if (piano === "BASE") {
    consigli.push({
      tone: "info",
      testo: "Il tuo piano Base mostra solo il Registro controlli: passa a Plus per includere anche Spese, Personale e Manutenzione, o a Completo per aggiungere anche i Laboratori.",
    });
  } else if (piano === "PLUS" && lavorazioniLab.length > 0) {
    consigli.push({
      tone: "info",
      testo: "Hai delle lavorazioni di laboratorio registrate, ma il piano Plus non le include nel bilancio: passa a Completo per un quadro totale.",
    });
  }
  if (consigli.length === 0 && bilancioPeriodo >= 0 && costoTotale > 0) {
    consigli.push({
      tone: "good",
      testo: `Il bilancio del periodo è positivo: ricavi superiori ai costi di ${formatCurrency(bilancioPeriodo)}.`,
    });
  }

  const CONSIGLIO_STYLE: Record<string, string> = {
    bad: "border-red-200 bg-red-50 text-red-800",
    warn: "border-amber-200 bg-amber-50 text-amber-800",
    info: "border-brand-200 bg-brand-50 text-brand-800",
    good: "border-emerald-200 bg-emerald-50 text-emerald-800",
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Bilancio dell'attività" description="Tutte le voci di ricavo e di costo, con accesso diretto a ogni singola registrazione." />

      <p className="flex items-start gap-1.5 text-xs text-slate-400">
        <span aria-hidden>ℹ️</span>
        Numeri e consigli sono una stima automatica basata su quanto inserito nell&apos;app: non sostituiscono il tuo commercialista.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {PERIODI_BILANCIO.map((p) => (
          <Link
            key={p.value}
            href={`/app/bilancio?periodo=${p.value}`}
            className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium ${
              periodo === p.value ? "bg-brand-600 text-white" : "border border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {p.label}
          </Link>
        ))}
        {periodo === "personalizzato" && (
          <form method="get" className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="periodo" value="personalizzato" />
            <input type="date" name="da" defaultValue={daIso} className="rounded-lg border border-slate-300 px-2 py-1 text-sm" />
            <span className="text-sm text-slate-400">—</span>
            <input type="date" name="a" defaultValue={aIso} className="rounded-lg border border-slate-300 px-2 py-1 text-sm" />
            <button type="submit" className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200">
              Applica
            </button>
          </form>
        )}
      </div>

      <section className="rounded-xl border-2 border-brand-200 bg-white p-5 shadow-md">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Bilancio — {titolo}</h2>
          <span className={`text-2xl font-bold ${bilancioPeriodo >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {bilancioPeriodo >= 0 ? "+" : ""}
            {formatCurrency(bilancioPeriodo)}
          </span>
        </div>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs text-slate-500">Ricavi del periodo (fatturato KPI)</dt>
            <dd className="text-lg font-semibold text-slate-900">{formatCurrency(ricaviPeriodo)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Costi totali stimati</dt>
            <dd className={`text-lg font-semibold ${costoTotale > ricaviPeriodo ? "text-red-600" : "text-slate-900"}`}>
              {formatCurrency(costoTotale)}
            </dd>
          </div>
        </dl>
      </section>

      {consigli.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">Appunti e consigli</h2>
          {consigli.map((c, i) => (
            <p key={i} className={`rounded-lg border px-4 py-3 text-sm ${CONSIGLIO_STYLE[c.tone]}`}>
              {c.testo}
            </p>
          ))}
        </section>
      )}

      <div className="space-y-4">
        {categorie.map((c) => (
          <section key={c.key} className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <span aria-hidden>{c.icon}</span>
                {c.label}
              </h3>
              <span className="text-base font-semibold text-slate-900">{c.locked ? "—" : formatCurrency(c.totale)}</span>
            </div>
            {c.locked ? (
              <p className="px-5 py-4 text-sm text-amber-700">
                Non incluso nel tuo piano attuale.{" "}
                <Link href={`/app/abbonamento?upgrade=${c.key}`} className="font-medium underline">
                  Passa a un piano superiore
                </Link>{" "}
                per vederlo qui.
              </p>
            ) : c.righe.length === 0 ? (
              <p className="px-5 py-4 text-sm text-slate-500">Nessuna voce in questo periodo.</p>
            ) : (
              <TableScroll>
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <tbody className="divide-y divide-slate-100">
                    {c.righe.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-5 py-2.5">
                          {r.href ? (
                            <Link href={r.href} className="font-medium text-brand-700 hover:underline">
                              {r.label}
                            </Link>
                          ) : (
                            <span className="font-medium text-slate-800">{r.label}</span>
                          )}
                          {r.sub && <span className="ml-2 text-xs text-slate-400">{r.sub}</span>}
                        </td>
                        <td className="whitespace-nowrap px-5 py-2.5 text-right font-medium text-slate-700">
                          {formatCurrency(r.importo)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScroll>
            )}
          </section>
        ))}
      </div>

    </div>
  );
}
