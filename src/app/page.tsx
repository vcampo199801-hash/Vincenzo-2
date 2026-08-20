import Link from "next/link";
import Image from "next/image";
import { PIANI, PIANI_ORDINE } from "@/lib/plans";
import { CookieSettingsLink } from "@/components/cookie-settings-link";

const MODULES = [
  { icon: "🗓️", title: "Scadenzario", desc: "24 adempimenti normativi standard già pronti: estintori, autoclave, messa a terra, sorveglianza sanitaria e altro. Stato calcolato in automatico." },
  { icon: "🛠️", title: "Registro controlli", desc: "Lo storico degli interventi con costi, utile per dimostrare la diligenza dello studio in caso di ispezione." },
  { icon: "📁", title: "Documenti", desc: "Checklist dei documenti obbligatori con percentuale di completezza dell'archivio." },
  { icon: "📊", title: "Dashboard", desc: "La fotografia dello studio in un colpo d'occhio: % di compliance, prossime scadenze, sintesi magazzino e bilancio." },
  { icon: "📦", title: "Magazzino", desc: "Scorte minime e scadenze lotti sempre sotto controllo, con avvisi automatici di riordino materiali quando la scorta scende sotto il minimo." },
  { icon: "💊", title: "Farmaci emergenza", desc: "Registro del carrello emergenza con avviso 90 giorni prima della scadenza, più controlli mensili." },
  { icon: "📇", title: "Fornitori", desc: "Rubrica dei referenti compliance e dei fornitori di materiali, collegata al magazzino." },
  { icon: "🎓", title: "Formazione ECM", desc: "Crediti ECM del team tracciati per il triennio, con avanzamento verso il target." },
  { icon: "👥", title: "Personale", desc: "Anagrafica dei dipendenti e archivio cedolini, senza la complessità di un gestionale HR.", piano: "Plus" },
  { icon: "🦷", title: "Laboratori", desc: "Registro lavorazioni e dichiarazioni di conformità dei dispositivi su misura, come richiesto dal Reg. UE 2017/745.", piano: "Completo" },
  { icon: "💶", title: "Spese", desc: "Le voci di spesa dello studio (affitto, utenze, collaboratori) con proiezione del costo annuo e riepilogo per categoria.", piano: "Plus" },
  { icon: "⚖️", title: "Bilancio aziendale", desc: "Sai subito se lo studio è in utile o in perdita: il fatturato si confronta da solo con tutti i costi — spese, personale, laboratori, manutenzioni — vista per anno, mese o un periodo a tua scelta. Niente più fogli Excel o attese per il commercialista. Completo dal piano Plus.", piano: "Plus" },
  { icon: "🧰", title: "Manutenzione", desc: "Controlli di routine dello staff — vacuum test, helix test e indicatori dell'autoclave, lubrificazione manipoli, pulizia aspiratori — ognuno con la propria cadenza, l'avviso quando è in ritardo e la firma di chi lo ha eseguito: sai sempre chi ha fatto cosa e quando.", piano: "Plus" },
  { icon: "📈", title: "KPI Studio", desc: "Fatturato, prime visite, appuntamenti e preventivi giorno per giorno, con grafici e resoconti settimanali, mensili e annuali.", piano: "Plus" },
  { icon: "🎬", title: "Comunicazione Pazienti", desc: "Materiali informativi pronti da mostrare in studio o condividere con un link prima dell'appuntamento.", piano: "Plus" },
  { icon: "📋", title: "Report ispezione", desc: "Report stampabile con lo stato di tutte le scadenze, pronto da mostrare in caso di ispezione ASL." },
  { icon: "💬", title: "Forum", desc: "Il confronto tra colleghi degli studi iscritti: dubbi clinici e gestionali, consigli, bacheca — mai anonimo, con adesione facoltativa." },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Image src="/brand/monogram.png" alt="" width={32} height={32} className="h-8 w-8" />
            <div className="leading-tight">
              <span className="block text-lg font-semibold text-brand-700">Scadenze in Regola</span>
              <span className="block text-[11px] font-medium text-slate-400">by Sorrisi in Regola</span>
            </div>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Accedi
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
            >
              Prova gratis 7 giorni
            </Link>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <Image src="/brand/monogram.png" alt="Scadenze in Regola" width={72} height={72} className="mx-auto mb-4 h-16 w-16" />
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Scadenze in Regola
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            L&apos;app <span className="text-slate-900 font-medium">di Sorrisi in Regola</span> che tiene sotto controllo
            scadenze, controlli, magazzino, farmaci e documenti del tuo studio odontoiatrico — così non ci pensi più tu.
          </p>

          <div className="mx-auto mt-6 flex max-w-2xl flex-wrap justify-center gap-2">
            {[
              { t: "🗓️ Scadenze sempre sotto controllo" },
              { t: "📧 Promemoria automatici via email" },
              { t: "⚖️ Bilancio e KPI dello studio", piano: "Plus" },
              { t: "📦 Magazzino e scadenza farmaci" },
              { t: "📋 Report pronto per le ispezioni ASL" },
            ].map(({ t, piano }) => (
              <span key={t} className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-medium text-brand-800 shadow-sm">
                {t}
                {piano && (
                  <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">{piano}</span>
                )}
              </span>
            ))}
          </div>

          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
            >
              Inizia la prova gratuita
            </Link>
            <a
              href="#prezzi"
              className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Vedi i prezzi
            </a>
          </div>
          <p className="mt-3 text-xs text-slate-400">7 giorni gratis, nessuna carta richiesta.</p>
          <p className="mt-6 text-sm text-slate-500">
            Un progetto di <span className="font-medium text-slate-700">Sorrisi in Regola</span> — lo store che ha già
            venduto i suoi prodotti a oltre <span className="font-medium text-slate-700">4.000 dentisti</span> in Italia.
          </p>
        </div>
      </section>

      <section className="border-y border-brand-100 bg-brand-50">
        <div className="mx-auto max-w-4xl px-6 py-12 text-center">
          <p className="text-3xl">📧</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Il vero valore: non ci devi pensare tu</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">
            Ogni giorno l&apos;app controlla da sola lo studio e, se qualcosa richiede attenzione, arriva un{" "}
            <strong className="text-slate-900">promemoria via email</strong> — prima che diventi un problema, non dopo.
          </p>
          <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-4 text-left sm:grid-cols-2">
            {[
              { icon: "🗓️", text: "Scadenze normative in avvicinamento (estintori, autoclave, sorveglianza sanitaria…)" },
              { icon: "💊", text: "Farmaci di emergenza vicini alla scadenza" },
              { icon: "📦", text: "Scorte di magazzino sotto la soglia minima, non solo i lotti in scadenza" },
              { icon: "🧰", text: "Manutenzioni dello staff in ritardo rispetto alla cadenza prevista" },
            ].map((v) => (
              <div key={v.text} className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm">
                <span className="text-xl" aria-hidden>{v.icon}</span>
                <p className="text-sm text-slate-600">{v.text}</p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-xs text-slate-500">
            Un clic direttamente dall&apos;email per silenziare una singola voce, senza bisogno di aprire l&apos;app.
          </p>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-12 text-center">
          <p className="text-3xl">🧑‍⚕️</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Ogni controllo ha una firma</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">
            Non sei sempre in studio, ma puoi comunque tenere sotto controllo{" "}
            <strong className="text-slate-900">chi fa cosa</strong>: ogni test dello staff riporta data, esito e il
            nome di chi lo ha eseguito, così sai sempre se i collaboratori stanno facendo il dovuto — non solo se lo
            studio è in regola.
          </p>
          <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-4 text-left sm:grid-cols-2">
            {[
              { icon: "🧴", text: "Autoclave: vacuum test, helix test, indicatore chimico e biologico — ognuno tracciato a parte, con la sua cadenza" },
              { icon: "🧽", text: "Lubrificazione manipoli e pulizia aspiratori, sempre registrate" },
              { icon: "✍️", text: "Ogni controllo è firmato da chi lo ha eseguito: nessun dubbio su chi ha fatto cosa e quando" },
              { icon: "⏰", text: "Avviso automatico se un collaboratore salta un controllo dovuto rispetto alla cadenza" },
            ].map((v) => (
              <div key={v.text} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                <span className="text-xl" aria-hidden>{v.icon}</span>
                <p className="text-sm text-slate-600">{v.text}</p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-sm text-slate-600">
            Basta invitare i collaboratori dalle Impostazioni: ognuno annota i propri controlli direttamente dal
            telefono o dal computer, anche mentre è in studio senza di te.
          </p>
          <p className="mx-auto mt-2 max-w-2xl text-xs text-slate-500">
            Un controllo in più su chi lavora in studio, senza dover chiedere ogni volta.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-2xl font-semibold text-slate-900">Tutto quello che serve, in un unico posto</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-slate-500">
          Moduli pensati per la compliance di uno studio dentistico, pronti all&apos;uso fin dal primo accesso.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((m) => (
            <div key={m.title} className="relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              {"piano" in m && m.piano && (
                <span className="absolute right-4 top-4 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
                  {m.piano}
                </span>
              )}
              <div className="text-2xl">{m.icon}</div>
              <h3 className="mt-3 font-semibold text-slate-900">{m.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="prezzi" className="border-t border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-2xl font-semibold text-slate-900">Un piano per ogni esigenza</h2>
          <p className="mt-2 text-slate-500">Nessun vincolo, disdici quando vuoi.</p>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {PIANI_ORDINE.map((key) => {
              const piano = PIANI[key];
              return (
                <div
                  key={key}
                  className={`relative flex flex-col rounded-2xl border p-8 text-left shadow-sm ${
                    piano.consigliato ? "border-brand-400 ring-2 ring-brand-100" : "border-slate-200"
                  } bg-white`}
                >
                  {piano.consigliato && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                      Consigliato
                    </span>
                  )}
                  <p className="text-sm font-medium text-brand-700">{piano.label}</p>
                  <p className="mt-2 text-4xl font-bold text-slate-900">
                    €{piano.prezzoEuro}
                    <span className="text-base font-medium text-slate-500">/mese</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-400">IVA inclusa · fatturazione mensile</p>
                  <p className="mt-4 text-sm text-slate-600">{piano.descrizione}</p>
                  <ul className="mt-4 flex-1 space-y-1.5 text-sm text-slate-600">
                    {piano.puntiChiave.map((punto) => (
                      <li key={punto}>✓ {punto}</li>
                    ))}
                  </ul>
                  <Link
                    href="/signup"
                    className="mt-6 block rounded-lg bg-brand-600 px-6 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
                  >
                    Inizia la prova gratuita
                  </Link>
                </div>
              );
            })}
          </div>

          <p className="mt-8 text-sm text-slate-500">
            Ogni piano include 7 giorni di prova gratuita, promemoria scadenze automatici e report stampabile per le
            ispezioni ASL.
          </p>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 text-center">
          <Image src="/brand/wordmark.png" alt="Sorrisi in Regola" width={160} height={57} className="h-8 w-auto opacity-70" />
          <p className="text-xs text-slate-400">
            Scadenze in Regola — by Sorrisi in Regola. Questo strumento è un supporto organizzativo e non sostituisce gli
            obblighi di verifica con i propri consulenti.
          </p>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
            <Link href="/privacy" className="hover:text-slate-800">Privacy Policy</Link>
            <Link href="/termini" className="hover:text-slate-800">Termini di servizio</Link>
            <CookieSettingsLink />
          </div>
        </div>
      </footer>
    </div>
  );
}
