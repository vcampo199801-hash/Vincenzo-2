import Link from "next/link";
import Image from "next/image";
import { PIANI, PIANI_ORDINE } from "@/lib/plans";

const MODULES = [
  { icon: "🗓️", title: "Scadenzario", desc: "24 adempimenti normativi standard già pronti: estintori, autoclave, messa a terra, sorveglianza sanitaria e altro. Stato calcolato in automatico." },
  { icon: "🛠️", title: "Registro controlli", desc: "Lo storico degli interventi con costi, utile per dimostrare la diligenza dello studio in caso di ispezione." },
  { icon: "🎓", title: "Formazione ECM", desc: "Crediti ECM del team tracciati per il triennio, con avanzamento verso il target." },
  { icon: "📁", title: "Documenti", desc: "Checklist dei documenti obbligatori con percentuale di completezza dell'archivio." },
  { icon: "📦", title: "Magazzino", desc: "Scorte minime, riordini automatici e scadenze lotti sempre sotto controllo." },
  { icon: "💊", title: "Farmaci emergenza", desc: "Registro del carrello emergenza con avviso 90 giorni prima della scadenza, più controlli mensili." },
  { icon: "📇", title: "Fornitori", desc: "Rubrica dei referenti compliance e dei fornitori di materiali, collegata al magazzino." },
  { icon: "📊", title: "Dashboard", desc: "La fotografia dello studio in un colpo d'occhio: % di compliance, prossime scadenze, sintesi magazzino." },
  { icon: "👥", title: "Personale", desc: "Anagrafica dei dipendenti e archivio cedolini, senza la complessità di un gestionale HR.", piano: "Plus" },
  { icon: "🦷", title: "Laboratori", desc: "Registro lavorazioni e dichiarazioni di conformità dei dispositivi su misura, come richiesto dal Reg. UE 2017/745.", piano: "Completo" },
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
              Prova gratis 14 giorni
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
            La app <span className="text-slate-900 font-medium">di Sorrisi in Regola</span> che tiene sotto controllo
            scadenze, controlli, magazzino, farmaci e documenti del tuo studio odontoiatrico — così non ci pensi più tu.
          </p>
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
          <p className="mt-3 text-xs text-slate-400">14 giorni gratis, nessuna carta richiesta.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-2xl font-semibold text-slate-900">Tutto quello che serve, in un unico posto</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-slate-500">
          Moduli pensati per la compliance di uno studio dentistico, pronti all&apos;uso fin dal primo accesso.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {PIANI_ORDINE.map((key) => {
              const piano = PIANI[key];
              return (
                <div
                  key={key}
                  className={`flex flex-col rounded-2xl border p-8 text-left shadow-sm ${
                    key === "PLUS" ? "border-brand-400 ring-2 ring-brand-100" : "border-slate-200"
                  } bg-white`}
                >
                  <p className="text-sm font-medium text-brand-700">{piano.label}</p>
                  <p className="mt-2 text-4xl font-bold text-slate-900">
                    €{piano.prezzoEuro}
                    <span className="text-base font-medium text-slate-500">/mese</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-400">IVA esclusa · fatturazione mensile</p>
                  <p className="mt-4 text-sm text-slate-600">{piano.descrizione}</p>
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
            Ogni piano include 14 giorni di prova gratuita, utenti e team illimitati, promemoria scadenze automatici e
            report stampabile per le ispezioni ASL.
          </p>

          <p className="mt-6 text-sm text-slate-500">
            Hai acquistato su Shopify?{" "}
            <Link href="/codice" className="font-medium text-brand-700">
              Attiva il tuo codice
            </Link>
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
        </div>
      </footer>
    </div>
  );
}
