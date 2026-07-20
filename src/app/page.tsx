import Link from "next/link";

const MODULES = [
  { icon: "🗓️", title: "Scadenzario", desc: "24 adempimenti normativi standard già pronti: estintori, autoclave, messa a terra, sorveglianza sanitaria e altro. Stato calcolato in automatico." },
  { icon: "🛠️", title: "Registro controlli", desc: "Lo storico degli interventi con costi, utile per dimostrare la diligenza dello studio in caso di ispezione." },
  { icon: "🎓", title: "Formazione ECM", desc: "Crediti ECM del team tracciati per il triennio, con avanzamento verso il target." },
  { icon: "📁", title: "Documenti", desc: "Checklist dei documenti obbligatori con percentuale di completezza dell'archivio." },
  { icon: "📦", title: "Magazzino", desc: "Scorte minime, riordini automatici e scadenze lotti sempre sotto controllo." },
  { icon: "💊", title: "Farmaci emergenza", desc: "Registro del carrello emergenza con avviso 90 giorni prima della scadenza, più controlli mensili." },
  { icon: "📇", title: "Fornitori", desc: "Rubrica dei referenti compliance e dei fornitori di materiali, collegata al magazzino." },
  { icon: "📊", title: "Dashboard", desc: "La fotografia dello studio in un colpo d'occhio: % di compliance, prossime scadenze, sintesi magazzino." },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold text-blue-700">Sorrisi in Regola</span>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Accedi
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              Prova gratis 14 giorni
            </Link>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-b from-blue-50 to-white">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Studio Sotto Controllo
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            La app che tiene sotto controllo scadenze, controlli, magazzino, farmaci e documenti del tuo studio
            odontoiatrico — così non ci pensi più tu.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
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
          Otto moduli pensati per la compliance di uno studio dentistico, pronti all&apos;uso fin dal primo accesso.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((m) => (
            <div key={m.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-2xl">{m.icon}</div>
              <h3 className="mt-3 font-semibold text-slate-900">{m.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="prezzi" className="border-t border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto max-w-md px-6 text-center">
          <h2 className="text-2xl font-semibold text-slate-900">Un piano semplice</h2>
          <p className="mt-2 text-slate-500">Nessun vincolo, disdici quando vuoi.</p>

          <div className="mt-8 rounded-2xl border border-blue-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-medium text-blue-700">Piano Studio</p>
            <p className="mt-2 text-4xl font-bold text-slate-900">
              €12<span className="text-base font-medium text-slate-500">/mese</span>
            </p>
            <p className="mt-1 text-xs text-slate-400">IVA esclusa · fatturazione mensile</p>
            <ul className="mt-6 space-y-2 text-left text-sm text-slate-600">
              <li>✓ Tutti gli 8 moduli di compliance</li>
              <li>✓ Utenti e team illimitati</li>
              <li>✓ Checklist standard precompilate</li>
              <li>✓ Promemoria scadenze automatici</li>
              <li>✓ 14 giorni di prova gratuita</li>
            </ul>
            <Link
              href="/signup"
              className="mt-6 block rounded-lg bg-blue-600 px-6 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Inizia la prova gratuita
            </Link>
          </div>

          <p className="mt-6 text-sm text-slate-500">
            Hai acquistato su Shopify?{" "}
            <Link href="/codice" className="font-medium text-blue-700">
              Attiva il tuo codice
            </Link>
          </p>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-xs text-slate-400">
          Sorrisi in Regola — Studio Sotto Controllo. Questo strumento è un supporto organizzativo e non sostituisce gli
          obblighi di verifica con i propri consulenti.
        </div>
      </footer>
    </div>
  );
}
