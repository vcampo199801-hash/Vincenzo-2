import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePersonaleAccess } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { logPersonaleAccess } from "@/lib/personale-access-log";
import {
  createMovimentoAssenza,
  deleteMovimentoAssenza,
  upsertSaldoAnnuale,
  createAdempimentoPersonale,
  deleteAdempimentoPersonale,
} from "@/lib/actions/personale";
import {
  scadenzaPersonaleStato,
  peggiore,
  stimaTfrAnnuale,
  calcolaMaturazioneAnno,
  optionLabel,
  MANSIONE_OPTIONS,
  TIPO_CONTRATTO_OPTIONS,
  STATO_DIPENDENTE_OPTIONS,
  TIPO_ASSENZA_OPTIONS,
  TIPOLOGIA_ADEMPIMENTO_OPTIONS,
  TFR_DISCLAIMER,
  COMPORTO_DISCLAIMER,
  MATURAZIONE_DISCLAIMER,
} from "@/lib/personale";
import { formatDate, formatCurrency } from "@/lib/compliance";
import { isAttachmentStorageConfigured } from "@/lib/attachments";
import { StatoBadge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/ui/delete-button";
import { Field, SelectField, TextAreaField, SubmitButton } from "@/components/ui/form";
import { DipendenteTabs } from "@/components/app/dipendente-tabs";
import { MaturazioneFields } from "@/components/app/maturazione-fields";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function DipendentePage({ params }: { params: Promise<{ id: string }> }) {
  const { studio, session } = await requirePersonaleAccess();
  const { id } = await params;

  const dipendente = await prisma.dipendente.findFirst({
    where: { id, studioId: studio.id },
    include: {
      movimentiAssenza: { orderBy: { dataInizio: "desc" } },
      saldiAnnuali: { orderBy: { anno: "desc" } },
      adempimentiPersonale: { orderBy: { dataScadenza: "asc" }, include: { fileAllegato: true } },
    },
  });
  if (!dipendente) notFound();

  await logPersonaleAccess({ studioId: studio.id, userId: session.userId, dipendenteId: id, azione: "VIEW_DIPENDENTE" });

  const annoCorrente = new Date().getFullYear();
  const saldoCorrente = dipendente.saldiAnnuali.find((s) => s.anno === annoCorrente) ?? null;
  const maturazioneSuggerita = calcolaMaturazioneAnno({
    anno: annoCorrente,
    dataAssunzione: dipendente.dataAssunzione,
    dataFineContratto: dipendente.dataFineContratto,
    oreSettimanali: dipendente.oreSettimanali,
    oreSettimanaliFullTime: dipendente.oreSettimanaliFullTime,
    ferieAnnueContrattuali: dipendente.ferieAnnueContrattuali,
    rolAnnueContrattuali: dipendente.rolAnnueContrattuali,
  });
  const tfr = saldoCorrente
    ? stimaTfrAnnuale({
        retribuzioneUtileAnnua: saldoCorrente.retribuzioneUtileAnnua,
        tfrAccantonatoInizioAnno: saldoCorrente.tfrAccantonatoInizioAnno,
        indiceRivalutazioneIstat: saldoCorrente.indiceRivalutazioneIstat,
      })
    : null;

  const statiCompliance = dipendente.adempimentiPersonale.map((a) => scadenzaPersonaleStato(a.dataScadenza).stato);
  const statoComplessivo = peggiore(statiCompliance);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">
              {dipendente.nome} {dipendente.cognome}
            </h1>
            {dipendente.adempimentiPersonale.length > 0 && <StatoBadge stato={statoComplessivo} />}
          </div>
          <p className="mt-1 text-sm text-slate-500">{optionLabel(MANSIONE_OPTIONS, dipendente.mansione)}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/app/personale/dipendenti/${dipendente.id}/fascicolo`}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            📋 Fascicolo PDF
          </Link>
          <Link
            href={`/app/personale/dipendenti/${dipendente.id}/edit`}
            className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
          >
            Modifica anagrafica
          </Link>
        </div>
      </div>

      <DipendenteTabs
        anagrafica={<AnagraficaTab dipendente={dipendente} />}
        assenze={
          <AssenzeTab
            dipendente={dipendente}
            saldoCorrente={saldoCorrente}
            maturazioneSuggerita={maturazioneSuggerita}
            tfr={tfr}
            annoCorrente={annoCorrente}
          />
        }
        compliance={<ComplianceTab dipendente={dipendente} />}
      />
    </div>
  );
}

type AnagraficaFields = {
  codiceFiscale: string | null;
  dataNascita: Date | null;
  mansione: string;
  tipoContratto: string;
  ccnl: string | null;
  livello: string | null;
  dataAssunzione: Date | null;
  dataFineContratto: Date | null;
  oreSettimanali: number | null;
  finePeriodoProva: Date | null;
  stato: string;
  note: string | null;
  oreSettimanaliFullTime: number;
  ferieAnnueContrattuali: number;
  rolAnnueContrattuali: number;
  retribuzioneLordaAnnua: number | null;
};

function AnagraficaTab({ dipendente: d }: { dipendente: AnagraficaFields }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <dl className="grid grid-cols-2 gap-6 text-sm sm:grid-cols-3">
        <Field2 label="Codice fiscale" value={d.codiceFiscale} />
        <Field2 label="Data di nascita" value={formatDate(d.dataNascita)} />
        <Field2 label="Mansione" value={optionLabel(MANSIONE_OPTIONS, d.mansione)} />
        <Field2 label="Tipo contratto" value={optionLabel(TIPO_CONTRATTO_OPTIONS, d.tipoContratto)} />
        <Field2 label="CCNL" value={d.ccnl} />
        <Field2 label="Livello" value={d.livello} />
        <Field2 label="Data assunzione" value={formatDate(d.dataAssunzione)} />
        <Field2 label="Data fine contratto" value={formatDate(d.dataFineContratto)} />
        <Field2 label="Ore settimanali" value={d.oreSettimanali ?? "—"} />
        <Field2 label="Fine periodo di prova" value={formatDate(d.finePeriodoProva)} />
        <Field2 label="Stato" value={optionLabel(STATO_DIPENDENTE_OPTIONS, d.stato)} />
      </dl>
      {d.note && (
        <div className="mt-6 border-t border-slate-100 pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Note</p>
          <p className="mt-1 text-sm text-slate-700">{d.note}</p>
        </div>
      )}
      <div className="mt-6 border-t border-slate-100 pt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Parametri per il calcolo automatico</p>
        <dl className="mt-2 grid grid-cols-2 gap-6 text-sm sm:grid-cols-4">
          <Field2 label="Ore tempo pieno" value={d.oreSettimanaliFullTime} />
          <Field2 label="Ferie annue (gg)" value={d.ferieAnnueContrattuali} />
          <Field2 label="ROL annuo (h)" value={d.rolAnnueContrattuali} />
          <Field2 label="Retribuzione di riferimento" value={d.retribuzioneLordaAnnua ? formatCurrency(d.retribuzioneLordaAnnua) : "—"} />
        </dl>
      </div>
    </div>
  );
}

function Field2({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-900">{value || "—"}</dd>
    </div>
  );
}

function AssenzeTab({
  dipendente,
  saldoCorrente,
  maturazioneSuggerita,
  tfr,
  annoCorrente,
}: {
  dipendente: {
    id: string;
    retribuzioneLordaAnnua: number | null;
    movimentiAssenza: Array<Record<string, unknown> & { id: string; tipo: string; dataInizio: Date; dataFine: Date | null; giorni: number | null; ore: number | null; note: string | null }>;
  };
  saldoCorrente: (Record<string, unknown> & {
    ferieMaturate: number;
    ferieGodute: number;
    rolMaturati: number;
    rolGoduti: number;
    giorniMalattiaAnno: number;
    giorniComportoMassimo: number;
    tfrAccantonatoInizioAnno: number;
    tfrAccantonatoAnno: number;
    destinazioneTfr: string | null;
    retribuzioneUtileAnnua: number | null;
    indiceRivalutazioneIstat: number | null;
  }) | null;
  maturazioneSuggerita: ReturnType<typeof calcolaMaturazioneAnno>;
  tfr: ReturnType<typeof stimaTfrAnnuale>;
  annoCorrente: number;
}) {
  const createMovimento = createMovimentoAssenza.bind(null, dipendente.id);
  const upsertSaldo = upsertSaldoAnnuale.bind(null, dipendente.id);
  const comportoAlert = saldoCorrente
    ? saldoCorrente.giorniMalattiaAnno / Math.max(saldoCorrente.giorniComportoMassimo, 1)
    : 0;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Saldo annuale {annoCorrente}</h2>
        <p className="mb-4 mt-1 text-sm text-slate-500">
          Ferie e ROL maturati sono già pre-compilati con una stima calcolata da tipo di contratto, ore settimanali
          e periodo lavorato: correggili se il consulente ti comunica un numero diverso. Aggiorna anche gli altri
          campi quando ricevi i dati dal consulente del lavoro. {MATURAZIONE_DISCLAIMER}
        </p>
        <form action={upsertSaldo} className="space-y-4">
          <input type="hidden" name="anno" value={annoCorrente} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <MaturazioneFields
              ferieIniziale={saldoCorrente?.ferieMaturate ?? maturazioneSuggerita?.ferieMaturate ?? 0}
              rolIniziale={saldoCorrente?.rolMaturati ?? maturazioneSuggerita?.rolMaturati ?? 0}
              ferieSuggerito={maturazioneSuggerita?.ferieMaturate ?? null}
              rolSuggerito={maturazioneSuggerita?.rolMaturati ?? null}
            />
            <Field
              label="Ferie godute"
              name="ferieGodute"
              type="number"
              step="0.5"
              defaultValue={saldoCorrente?.ferieGodute ?? 0}
              hint="Giorni di ferie già presi."
            />
            <Field
              label="ROL goduti"
              name="rolGoduti"
              type="number"
              step="0.5"
              defaultValue={saldoCorrente?.rolGoduti ?? 0}
              hint="Permessi ROL già usati."
            />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field
              label="Giorni malattia anno"
              name="giorniMalattiaAnno"
              type="number"
              step="0.5"
              defaultValue={saldoCorrente?.giorniMalattiaAnno ?? 0}
              hint="Totale giorni di malattia registrati quest'anno."
            />
            <Field
              label="Giorni comporto massimo (CCNL)"
              name="giorniComportoMassimo"
              type="number"
              defaultValue={saldoCorrente?.giorniComportoMassimo ?? 180}
              hint="Oltre questo limite di giorni di malattia scatta il rischio di licenziamento per superamento del comporto: il valore varia per CCNL, verificalo col consulente."
            />
            <Field
              label="Destinazione TFR"
              name="destinazioneTfr"
              defaultValue={saldoCorrente?.destinazioneTfr}
              placeholder="Es. Fondo pensione / Azienda"
              hint="Facoltativo. Dove viene accantonato il TFR del dipendente."
            />
          </div>
          <p className="text-xs text-slate-500">{COMPORTO_DISCLAIMER}</p>
          {comportoAlert >= 0.7 && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
              Attenzione: {Math.round(comportoAlert * 100)}% del limite di comporto utilizzato.
            </p>
          )}

          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm font-medium text-slate-700">TFR — dati per la stima (facoltativi)</p>
            <p className="mb-3 mt-1 text-xs text-slate-500">
              Se non hai questi dati sottomano, lasciali vuoti: puoi chiederli al consulente del lavoro e inserirli
              in un secondo momento. Servono solo per farti un&apos;idea di massima, non sono il valore ufficiale.
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field
                label="Retribuzione utile annua (€)"
                name="retribuzioneUtileAnnua"
                type="number"
                step="0.01"
                defaultValue={saldoCorrente?.retribuzioneUtileAnnua ?? dipendente.retribuzioneLordaAnnua ?? undefined}
                hint="La retribuzione lorda annua su cui si calcola il TFR (dal cedolino/CU). Pre-compilata dai dati del contratto, se inseriti in anagrafica."
              />
              <Field
                label="TFR accantonato inizio anno (€)"
                name="tfrAccantonatoInizioAnno"
                type="number"
                step="0.01"
                defaultValue={saldoCorrente?.tfrAccantonatoInizioAnno ?? 0}
                hint="Quanto TFR risultava già accantonato all'inizio dell'anno."
              />
              <Field
                label="TFR accantonato nell'anno (€)"
                name="tfrAccantonatoAnno"
                type="number"
                step="0.01"
                defaultValue={saldoCorrente?.tfrAccantonatoAnno ?? 0}
                hint="Facoltativo, solo come promemoria: non entra nella formula di stima."
              />
              <Field
                label="Indice rivalutazione ISTAT (%)"
                name="indiceRivalutazioneIstat"
                type="number"
                step="0.01"
                defaultValue={saldoCorrente?.indiceRivalutazioneIstat ?? undefined}
                placeholder="Es. 5.2"
                hint="Indice ISTAT dell'anno, da inserire manualmente (te lo comunica di norma il consulente)."
              />
            </div>
          </div>
          <SubmitButton>Salva saldo {annoCorrente}</SubmitButton>
        </form>

        {tfr && (
          <div className="mt-6 rounded-lg border border-brand-200 bg-brand-50 p-4">
            <p className="mb-2 text-sm font-semibold text-brand-800">Stima TFR {annoCorrente}</p>
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <Field2 label="Quota lorda annua" value={formatCurrency(tfr.quotaLorda)} />
              <Field2 label="Contributo IVS (0,50%)" value={formatCurrency(tfr.contributoIvs)} />
              <Field2 label="Quota netta accantonata" value={formatCurrency(tfr.quotaNettaAccantonata)} />
              <Field2 label={`Rivalutazione (${tfr.percentualeRivalutazione.toFixed(2)}%)`} value={formatCurrency(tfr.rivalutazione)} />
              <Field2 label="Totale stimato" value={formatCurrency(tfr.totaleStimato)} />
            </dl>
            <p className="mt-3 text-xs text-brand-700">⚠️ {TFR_DISCLAIMER}</p>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Movimenti assenza</h2>
        <p className="mb-4 mt-1 text-sm text-slate-500">
          Registra qui ogni singola assenza (un giorno di ferie, un periodo di malattia, un permesso...). Ti serve
          per avere lo storico e per far quadrare i conteggi col consulente del lavoro.
        </p>
        <form action={createMovimento} className="mb-6 space-y-3 rounded-lg border border-slate-100 bg-slate-50 p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SelectField label="Tipo" name="tipo" defaultValue="FERIE" options={TIPO_ASSENZA_OPTIONS} />
            <Field label="Data inizio" name="dataInizio" type="date" required />
            <Field label="Data fine" name="dataFine" type="date" hint="Lascia vuoto per un'assenza di un solo giorno." />
            <Field label="Giorni" name="giorni" type="number" step="0.5" hint="Facoltativo. Es. 0.5 per una mezza giornata." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Protocollo certificato"
              name="protocolloCertificato"
              placeholder="Es. per malattia/infortunio"
              hint="Facoltativo. Il numero di protocollo del certificato medico/INAIL, se presente."
            />
            <Field label="Note" name="note" />
          </div>
          <SubmitButton>Registra movimento</SubmitButton>
        </form>

        <ul className="divide-y divide-slate-100">
          {dipendente.movimentiAssenza.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-slate-800">{optionLabel(TIPO_ASSENZA_OPTIONS, m.tipo)}</p>
                <p className="text-xs text-slate-500">
                  {formatDate(m.dataInizio)}
                  {m.dataFine ? ` → ${formatDate(m.dataFine)}` : ""}
                  {m.giorni ? ` · ${m.giorni} gg` : ""}
                  {m.ore ? ` · ${m.ore} h` : ""}
                </p>
              </div>
              <DeleteButton action={deleteMovimentoAssenza.bind(null, m.id, dipendente.id)} />
            </li>
          ))}
          {dipendente.movimentiAssenza.length === 0 && <p className="py-4 text-sm text-slate-500">Nessun movimento registrato.</p>}
        </ul>
      </section>
    </div>
  );
}

function ComplianceTab({
  dipendente,
}: {
  dipendente: {
    id: string;
    adempimentiPersonale: Array<{
      id: string;
      tipologia: string;
      dataEsecuzione: Date | null;
      dataScadenza: Date | null;
      esito: string | null;
      fileAllegato: { id: string; nomeFile: string } | null;
    }>;
  };
}) {
  const createAdempimento = createAdempimentoPersonale.bind(null, dipendente.id);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">Adempimenti e formazione</h2>
      <p className="mb-4 mt-1 text-sm text-slate-500">
        Qui registri visite mediche, corsi di formazione, vaccinazioni e altre scadenze obbligatorie legate a
        questo dipendente. Scegli la tipologia, inserisci quando è stata fatta e l&apos;app calcola da sola la
        prossima scadenza (se ricorrente) e ti avvisa in dashboard quando si avvicina.
      </p>

      <form action={createAdempimento} className="mb-6 space-y-3 rounded-lg border border-slate-100 bg-slate-50 p-4">
        <SelectField label="Tipologia" name="tipologia" defaultValue={TIPOLOGIA_ADEMPIMENTO_OPTIONS[0].value} options={TIPOLOGIA_ADEMPIMENTO_OPTIONS} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Data esecuzione" name="dataEsecuzione" type="date" hint="Quando è stata svolta l'ultima volta." />
          <Field
            label="Periodicità (mesi)"
            name="periodicitaMesi"
            type="number"
            placeholder="Es. 36"
            hint="Ogni quanti mesi va ripetuta: 12 = annuale, 36 = triennale, 60 = quinquennale. Lascia vuoto se non si ripete (es. consegna DPI)."
          />
          <Field
            label="Scadenza (se diversa dal calcolo)"
            name="dataScadenza"
            type="date"
            hint="Lascia vuoto per farla calcolare automaticamente da data esecuzione + periodicità."
          />
        </div>
        <Field
          label="Esito / idoneità"
          name="esito"
          placeholder="Es. Idoneo, Idoneo con prescrizioni, Completato"
          hint="Facoltativo. L'esito riportato sul certificato o attestato."
        />
        <div>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Allegato (certificato, attestato)</span>
            <input
              type="file"
              name="file"
              disabled={!isAttachmentStorageConfigured()}
              className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 disabled:opacity-50"
            />
          </label>
          <p className="mt-1 text-xs text-slate-400">
            {isAttachmentStorageConfigured()
              ? "Facoltativo. Il file viene cifrato e conservato in modo sicuro (dati sanitari, art. 9 GDPR)."
              : "Nota per lo sviluppatore: imposta BLOB_READ_WRITE_TOKEN e ATTACHMENT_ENCRYPTION_KEY in .env per abilitare gli allegati cifrati."}
          </p>
        </div>
        <TextAreaField label="Note" name="note" />
        <SubmitButton>Registra adempimento</SubmitButton>
      </form>

      <ul className="divide-y divide-slate-100">
        {dipendente.adempimentiPersonale.map((a) => {
          const { stato, giorni } = scadenzaPersonaleStato(a.dataScadenza);
          return (
            <li key={a.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-slate-800">{optionLabel(TIPOLOGIA_ADEMPIMENTO_OPTIONS, a.tipologia)}</p>
                <p className="text-xs text-slate-500">
                  Eseguito il {formatDate(a.dataEsecuzione)} · Scadenza {formatDate(a.dataScadenza)}
                  {giorni !== null ? ` (${giorni < 0 ? `scaduto da ${Math.abs(giorni)}gg` : `tra ${giorni}gg`})` : ""}
                  {a.esito ? ` · ${a.esito}` : ""}
                </p>
                {a.fileAllegato && (
                  <a href={`/api/personale/allegati/${a.fileAllegato.id}`} className="text-xs font-medium text-brand-600 hover:text-brand-800">
                    📎 {a.fileAllegato.nomeFile}
                  </a>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <StatoBadge stato={stato} />
                <DeleteButton action={deleteAdempimentoPersonale.bind(null, a.id, dipendente.id)} />
              </div>
            </li>
          );
        })}
        {dipendente.adempimentiPersonale.length === 0 && <p className="py-4 text-sm text-slate-500">Nessun adempimento registrato.</p>}
      </ul>
    </div>
  );
}
