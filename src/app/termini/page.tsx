import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Termini di servizio — Scadenze in Regola",
};

export default function TerminiPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/brand/monogram.png" alt="" width={32} height={32} className="h-8 w-8" />
            <div className="leading-tight">
              <span className="block text-lg font-semibold text-brand-700">Scadenze in Regola</span>
              <span className="block text-[11px] font-medium text-slate-400">by Sorrisi in Regola</span>
            </div>
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="/privacy" className="text-slate-600 hover:text-slate-900">
              Privacy Policy
            </Link>
            <Link href="/" className="text-slate-600 hover:text-slate-900">
              Home
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-14">
        <h1 className="text-3xl font-semibold text-slate-900">Termini di servizio</h1>
        <p className="mt-2 text-sm text-slate-500">Ultimo aggiornamento: 19 agosto 2026</p>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          <p><strong className="text-slate-900">Fornitore del servizio:</strong> So.I.Re. S.r.l.s.</p>
          <p><strong className="text-slate-900">Sede legale:</strong> Piazza della Vittoria 10, 81024 Maddaloni (CE)</p>
          <p><strong className="text-slate-900">P.IVA / Codice Fiscale:</strong> 04953190610</p>
          <p><strong className="text-slate-900">REA:</strong> CE - 368697</p>
          <p><strong className="text-slate-900">Email:</strong> sorrisiinregola@gmail.com</p>
        </div>

        <p className="mt-6 text-sm text-slate-500">
          L&apos;accesso e l&apos;utilizzo di Scadenze in Regola sono regolati dai termini seguenti. Registrandoti o
          utilizzando il servizio, accetti integralmente queste condizioni.
        </p>

        <div className="mt-10 space-y-9 text-slate-700">
          <section>
            <h2 className="text-lg font-semibold text-slate-900">1. Oggetto del servizio</h2>
            <p className="mt-2 leading-relaxed">
              Scadenze in Regola è un&apos;applicazione software in abbonamento (SaaS) che assiste gli studi
              odontoiatrici nella gestione degli adempimenti di conformità normativa: scadenzario, registro
              controlli, formazione ECM, documenti obbligatori, magazzino, farmaci di emergenza, fornitori, report
              ispettivi e moduli correlati. Il servizio è uno strumento organizzativo: non fornisce consulenza
              legale né sostituisce la responsabilità del titolare dello studio nel rispetto degli obblighi
              normativi applicabili alla propria attività.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">2. Account e accesso</h2>
            <p className="mt-2 leading-relaxed">
              Per usare il servizio è necessario creare un account fornendo dati veritieri. Ogni studio è
              responsabile della riservatezza delle proprie credenziali e delle attività svolte tramite il proprio
              account, inclusi gli account dei collaboratori eventualmente invitati.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">3. Piani, prezzi e prova gratuita</h2>
            <p className="mt-2 leading-relaxed">
              Il servizio è offerto in tre piani (Base, Plus, Completo), ciascuno con un proprio prezzo mensile
              indicato nella pagina &quot;Abbonamento&quot; dell&apos;app. Ogni nuovo studio riceve un periodo di
              prova gratuita di 7 giorni; allo scadere della prova, l&apos;accesso ai moduli richiede
              l&apos;attivazione di un piano a pagamento.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">4. Fatturazione e pagamenti</h2>
            <p className="mt-2 leading-relaxed">
              I pagamenti sono gestiti da Stripe. L&apos;addebito avviene automaticamente ogni mese sul metodo di
              pagamento registrato, fino a disdetta dell&apos;abbonamento. I dati della carta sono raccolti
              direttamente da Stripe e non transitano sui nostri server.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">5. Durata, rinnovo e disdetta</h2>
            <p className="mt-2 leading-relaxed">
              L&apos;abbonamento si rinnova automaticamente ogni mese fino a quando non viene annullato. La
              disdetta può essere effettuata in qualsiasi momento dalla pagina &quot;Abbonamento&quot; dell&apos;app
              ed ha effetto alla fine del periodo già pagato: non sono previsti rimborsi per il periodo in corso.
            </p>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              Poiché il servizio è rivolto a professionisti e imprese (studi odontoiatrici) e non a consumatori
              privati, non si applicano le norme sul diritto di recesso del Codice del Consumo previste per i
              contratti B2C.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">6. Uso corretto del servizio</h2>
            <p className="mt-2 leading-relaxed">
              È vietato utilizzare il servizio per scopi illeciti, tentare di accedere a dati di altri studi,
              sovraccaricare intenzionalmente l&apos;infrastruttura o compiere azioni che possano comprometterne
              la sicurezza o la disponibilità per altri utenti.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">7. Titolarità dei dati inseriti</h2>
            <p className="mt-2 leading-relaxed">
              Tutti i dati inseriti nell&apos;app (scadenze, documenti, anagrafiche, ecc.) restano di proprietà
              dello studio che li ha inseriti. In caso di disdetta, lo studio può richiedere l&apos;esportazione
              dei propri dati prima della cancellazione dell&apos;account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">8. Disponibilità e limitazioni di responsabilità</h2>
            <p className="mt-2 leading-relaxed">
              Ci impegniamo a mantenere il servizio disponibile e funzionante, ma non garantiamo un funzionamento
              ininterrotto o privo di errori. Il servizio è uno strumento di supporto organizzativo: resta
              responsabilità esclusiva dello studio verificare il rispetto dei propri obblighi normativi,
              indipendentemente dai promemoria generati dall&apos;app.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">9. Proprietà intellettuale</h2>
            <p className="mt-2 leading-relaxed">
              Il software, il marchio &quot;Scadenze in Regola&quot; e tutti i contenuti dell&apos;applicazione
              sono di proprietà di So.I.Re. S.r.l.s. e protetti dalle leggi sulla proprietà intellettuale.
              L&apos;abbonamento concede un diritto d&apos;uso del servizio, non la cessione di alcun diritto di
              proprietà intellettuale.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">10. Modifiche al servizio e ai termini</h2>
            <p className="mt-2 leading-relaxed">
              Ci riserviamo il diritto di aggiornare funzionalità e prezzi del servizio. Eventuali modifiche
              sostanziali ai presenti termini saranno comunicate via email con ragionevole anticipo rispetto alla
              loro entrata in vigore.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">11. Legge applicabile e foro competente</h2>
            <p className="mt-2 leading-relaxed">
              I presenti termini sono regolati dalla legge italiana. Per qualsiasi controversia è competente in
              via esclusiva il Foro di Santa Maria Capua Vetere, competente per territorio in base alla sede
              legale del titolare a Maddaloni (CE).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">12. Contatti</h2>
            <p className="mt-2 leading-relaxed">
              Per qualsiasi domanda su questi termini o sull&apos;informativa privacy:{" "}
              <a href="mailto:sorrisiinregola@gmail.com" className="text-brand-700 underline">sorrisiinregola@gmail.com</a>.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 text-center">
          <p className="text-xs text-slate-400">Scadenze in Regola — by Sorrisi in Regola</p>
        </div>
      </footer>
    </div>
  );
}
