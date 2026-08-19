import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Privacy Policy — Scadenze in Regola",
};

export default function PrivacyPage() {
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
            <Link href="/termini" className="text-slate-600 hover:text-slate-900">
              Termini di servizio
            </Link>
            <Link href="/" className="text-slate-600 hover:text-slate-900">
              Home
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-14">
        <h1 className="text-3xl font-semibold text-slate-900">Informativa sulla privacy</h1>
        <p className="mt-2 text-sm text-slate-500">Ultimo aggiornamento: 19 agosto 2026</p>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          <p><strong className="text-slate-900">Titolare del trattamento:</strong> So.I.Re. S.r.l.s.</p>
          <p><strong className="text-slate-900">Sede legale:</strong> Piazza della Vittoria 10, 81024 Maddaloni (CE)</p>
          <p><strong className="text-slate-900">P.IVA / Codice Fiscale:</strong> 04953190610</p>
          <p><strong className="text-slate-900">REA:</strong> CE - 368697</p>
          <p><strong className="text-slate-900">Email:</strong> sorrisiinregola@gmail.com</p>
        </div>

        <p className="mt-6 text-sm text-slate-500">
          Ai sensi degli articoli 13 e 14 del Regolamento (UE) 2016/679 (&quot;GDPR&quot;), questa informativa descrive come
          So.I.Re. S.r.l.s. tratta i dati personali di chi utilizza Scadenze in Regola.
        </p>

        <div className="mt-10 space-y-9 text-slate-700">
          <section>
            <h2 className="text-lg font-semibold text-slate-900">1. Titolare del trattamento</h2>
            <p className="mt-2 leading-relaxed">
              Il titolare del trattamento dei dati raccolti tramite l&apos;app è So.I.Re. S.r.l.s., con sede in
              Piazza della Vittoria 10, 81024 Maddaloni (CE) — P.IVA e Codice Fiscale 04953190610, REA CE - 368697.
              Per qualsiasi richiesta relativa al trattamento dei dati è possibile scrivere a{" "}
              <a href="mailto:sorrisiinregola@gmail.com" className="text-brand-700 underline">sorrisiinregola@gmail.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">2. Dati raccolti</h2>
            <h3 className="mt-3 font-medium text-slate-900">2.1 — Dati dell&apos;account e dello studio</h3>
            <p className="mt-1 leading-relaxed">
              Al momento della registrazione raccogliamo nome dello studio, nome del titolare, email, password
              (conservata sotto forma di hash, mai in chiaro), indirizzo, telefono e — se attivate — le preferenze
              di notifica email/SMS.
            </p>
            <h3 className="mt-3 font-medium text-slate-900">2.2 — Dati inseriti nei moduli di compliance</h3>
            <p className="mt-1 leading-relaxed">
              Scadenze, controlli periodici, crediti ECM, documenti obbligatori, magazzino, farmaci di emergenza,
              fornitori, spese e manutenzioni: sono dati organizzativi dello studio, inseriti volontariamente da
              chi usa l&apos;app per tenere traccia dei propri obblighi normativi.
            </p>
            <h3 className="mt-3 font-medium text-slate-900">2.3 — Dati particolari del personale (art. 9 GDPR)</h3>
            <p className="mt-1 leading-relaxed">
              Il modulo &quot;Gestione Personale&quot;, riservato al titolare dello studio, può contenere dati
              relativi alla salute dei dipendenti (idoneità sanitaria, vaccinazioni, assenze per malattia). Si
              tratta di categorie particolari di dati ai sensi dell&apos;art. 9 GDPR: il loro trattamento è
              consentito solo al titolare dello studio, ogni accesso è registrato in un log interno, e gli
              eventuali allegati sono conservati cifrati.
            </p>
            <h3 className="mt-3 font-medium text-slate-900">2.4 — Dati di pagamento</h3>
            <p className="mt-1 leading-relaxed">
              I dati della carta di credito o del metodo di pagamento non transitano né vengono conservati sui
              nostri server: sono raccolti ed elaborati direttamente da Stripe, il nostro fornitore di servizi di
              pagamento (si veda la sezione 5).
            </p>
            <h3 className="mt-3 font-medium text-slate-900">2.5 — Dati tecnici</h3>
            <p className="mt-1 leading-relaxed">
              Come qualunque servizio web, raccogliamo automaticamente log tecnici minimi (indirizzo IP, tipo di
              browser, orari di accesso) necessari al funzionamento e alla sicurezza del servizio.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">3. Finalità e base giuridica</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5 leading-relaxed">
              <li><strong className="text-slate-900">Erogazione del servizio</strong> (esecuzione del contratto, art. 6.1.b GDPR): creare l&apos;account, far funzionare i moduli, inviare i promemoria di scadenza richiesti.</li>
              <li><strong className="text-slate-900">Fatturazione e gestione dell&apos;abbonamento</strong> (esecuzione del contratto / obbligo legale, art. 6.1.b–c): tramite Stripe.</li>
              <li><strong className="text-slate-900">Trattamento dei dati sanitari del personale</strong> (art. 9.2.b, adempimento di obblighi in materia di diritto del lavoro e protezione sociale): solo su iniziativa e responsabilità del titolare dello studio, che agisce come titolare autonomo per questi dati.</li>
              <li><strong className="text-slate-900">Sicurezza e prevenzione abusi</strong> (legittimo interesse, art. 6.1.f).</li>
              <li><strong className="text-slate-900">Comunicazioni di servizio</strong> (esecuzione del contratto): email/SMS di promemoria, se attivati dallo studio nelle impostazioni.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">4. Sicurezza dei dati</h2>
            <p className="mt-2 leading-relaxed">
              Le password sono conservate come hash, mai in chiaro. Gli allegati del modulo Personale (documenti
              con dati sanitari) sono cifrati con AES-256-GCM prima di essere salvati. Le comunicazioni tra il
              browser e i nostri server avvengono sempre via HTTPS. L&apos;accesso ai dati del modulo Personale è
              riservato al solo titolare dello studio ed è tracciato in un registro di accesso interno.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">5. Fornitori e sub-responsabili</h2>
            <p className="mt-2 leading-relaxed">
              Per erogare il servizio ci appoggiamo ai seguenti fornitori esterni, che trattano i dati in qualità
              di responsabili del trattamento per nostro conto:
            </p>
            <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Fornitore</th>
                    <th className="px-4 py-2">Funzione</th>
                    <th className="px-4 py-2">Dati coinvolti</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr><td className="px-4 py-2 font-medium text-slate-900">Stripe, Inc.</td><td className="px-4 py-2">Pagamenti e fatturazione dell&apos;abbonamento</td><td className="px-4 py-2">Dati della carta, email, nome dello studio</td></tr>
                  <tr><td className="px-4 py-2 font-medium text-slate-900">Resend</td><td className="px-4 py-2">Invio delle email di promemoria e notifica</td><td className="px-4 py-2">Indirizzo email, contenuto del promemoria</td></tr>
                  <tr><td className="px-4 py-2 font-medium text-slate-900">Twilio Inc.</td><td className="px-4 py-2">Invio degli SMS di promemoria (se attivati)</td><td className="px-4 py-2">Numero di telefono, contenuto del promemoria</td></tr>
                  <tr><td className="px-4 py-2 font-medium text-slate-900">Vercel Inc.</td><td className="px-4 py-2">Hosting dell&apos;applicazione</td><td className="px-4 py-2">Tutti i dati dell&apos;app, in transito ed elaborazione</td></tr>
                  <tr><td className="px-4 py-2 font-medium text-slate-900">Neon Inc.</td><td className="px-4 py-2">Database (archiviazione dei dati)</td><td className="px-4 py-2">Tutti i dati dell&apos;app, a riposo</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Con ciascun fornitore sono in vigore i relativi accordi sul trattamento dei dati (Data Processing
              Agreement) previsti dai loro termini di servizio standard.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">6. Trasferimento dei dati extra-UE</h2>
            <p className="mt-2 leading-relaxed">
              Stripe, Resend, Twilio, Vercel e Neon sono società con sede (anche) negli Stati Uniti. Ove i dati
              vengano trattati al di fuori dello Spazio Economico Europeo, il trasferimento avviene sulla base
              delle Clausole Contrattuali Standard approvate dalla Commissione Europea o di altro meccanismo di
              adeguatezza equivalente previsto dal GDPR.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">7. Conservazione dei dati</h2>
            <p className="mt-2 leading-relaxed">
              I dati sono conservati per tutta la durata dell&apos;abbonamento e per il periodo successivo
              necessario ad adempiere a obblighi contabili e fiscali (di norma 10 anni per i dati di fatturazione).
              Su richiesta scritta, i dati dello studio possono essere esportati o cancellati, salvi gli obblighi
              di legge che ne impongono la conservazione.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">8. Diritti dell&apos;interessato</h2>
            <p className="mt-2 leading-relaxed">
              In qualità di interessato hai diritto di accesso, rettifica, cancellazione, limitazione,
              portabilità e opposizione al trattamento dei tuoi dati (artt. 15–22 GDPR), oltre al diritto di
              proporre reclamo al Garante per la protezione dei dati personali. Per esercitare questi diritti
              scrivi a <a href="mailto:sorrisiinregola@gmail.com" className="text-brand-700 underline">sorrisiinregola@gmail.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">9. Dati dei pazienti dello studio</h2>
            <div className="mt-2 rounded-lg border-l-4 border-brand-500 bg-brand-50 px-4 py-3 leading-relaxed">
              Se lo studio utilizza il modulo &quot;Comunicazione Pazienti&quot; per condividere documenti o
              informazioni con i propri pazienti, lo studio odontoiatrico resta l&apos;unico titolare del
              trattamento dei dati dei pazienti. So.I.Re. S.r.l.s. agisce in questo caso come responsabile del
              trattamento (art. 28 GDPR) per conto dello studio, limitatamente all&apos;infrastruttura tecnica
              necessaria a rendere disponibile la comunicazione.
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">10. Modifiche alla presente informativa</h2>
            <p className="mt-2 leading-relaxed">
              Questa informativa può essere aggiornata nel tempo. In caso di modifiche sostanziali, gli utenti
              registrati saranno avvisati via email prima dell&apos;entrata in vigore delle nuove condizioni.
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
