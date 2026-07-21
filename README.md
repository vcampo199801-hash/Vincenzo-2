# Scadenze in Regola — by Sorrisi in Regola

App SaaS di compliance per studi odontoiatrici: scadenze, registro controlli, formazione ECM,
documenti, magazzino, farmaci di emergenza e fornitori — con abbonamento mensile ricorrente.

Basata sul foglio Excel "Studio Sotto Controllo — Sorrisi in Regola", reimplementata come web app
multi-tenant (uno studio per account) con provisioning automatico delle 24 scadenze normative
standard, checklist documenti e rubrica fornitori al momento della registrazione.

## Stack

- **Next.js 15** (App Router, TypeScript, Server Actions) + Tailwind CSS
- **Prisma** + **PostgreSQL**
- Sessioni **JWT firmate** in cookie httpOnly (nessuna dipendenza da provider OAuth esterni)
- **Stripe Checkout + Billing Portal + webhook** per l'abbonamento mensile ricorrente

## Sviluppo locale

Serve un database Postgres raggiungibile (locale, oppure uno gratuito su Neon/Supabase/Vercel).

```bash
npm install
cp .env.example .env   # imposta DATABASE_URL e genera AUTH_SECRET con: openssl rand -base64 32
npx prisma migrate dev
npm run db:seed        # crea uno studio demo con dati di esempio
npm run dev
```

Login demo (dopo il seed): `demo@sorrisiinregola.it` / `demo12345`.

## Pubblicare l'app online (Vercel)

Il modo più veloce per ottenere un link pubblico da aprire nel browser:

1. **Crea un database Postgres gratuito** — la via più semplice è [Neon](https://neon.tech) o
   [Vercel Postgres](https://vercel.com/storage/postgres) (bastano un paio di click, nessuna carta
   richiesta per il piano free). Copia la connection string che ti danno (inizia con
   `postgresql://...`).
2. Vai su [vercel.com](https://vercel.com), accedi con GitHub e scegli **Add New → Project**.
3. Importa questo repository (`vcampo199801-hash/Vincenzo-2`), branch
   `claude/app-monthly-subscription-idfylw` (o `main` una volta uniti i branch).
4. Nella schermata di configurazione, apri **Environment Variables** e aggiungi almeno:
   - `DATABASE_URL` — la connection string del database creato al passo 1
   - `AUTH_SECRET` — genera un valore con `openssl rand -base64 32`
   - `NEXT_PUBLIC_APP_URL` — l'URL che Vercel ti assegnerà (puoi aggiornarlo dopo il primo deploy)
   - Le variabili `STRIPE_*` sono opzionali: senza di esse l'app funziona lo stesso, mostra solo un
     avviso nella pagina Abbonamento invece del pulsante di pagamento.
5. Premi **Deploy**. Il comando di build (`prisma migrate deploy && next build`) crea
   automaticamente le tabelle nel database al primo avvio.
6. (Opzionale) Esegui `npm run db:seed` puntando `DATABASE_URL` al database di produzione per avere
   subito uno studio demo da mostrare.

Da quel momento l'app è raggiungibile all'indirizzo che Vercel assegna (tipo
`https://tuo-progetto.vercel.app`), aggiornato automaticamente a ogni push sul branch collegato.

## Abbonamento (Stripe)

L'app funziona in locale senza Stripe configurato (mostra un avviso nella pagina Abbonamento).
Per abilitare i pagamenti reali:

1. Crea un prodotto ricorrente mensile (es. €12/mese) nella Stripe Dashboard (modalità test).
2. Imposta in `.env`: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`.
3. Inoltra gli eventi webhook in locale con `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

Ogni nuovo studio riceve 14 giorni di prova gratuita (`TRIAL_DAYS` in `.env`); allo scadere della
prova l'accesso ai moduli viene bloccato finché non si attiva l'abbonamento dalla pagina
"Abbonamento".

## Codici di attivazione (vendita via Shopify)

In alternativa a Stripe, l'abbonamento può essere attivato con un **codice monouso** — pensato per
la vendita tramite un'app di codici digitali su Shopify (lo shop assegna un codice a ogni ordine).

```bash
npm run codes:generate -- --count 50 --days 30 --note "Batch 2026-07" --out codes.csv
```

Genera 50 codici univoci (formato `SIR-XXXX-XXXX-XXXX`), li salva nel database come "non
riscattati" e produce un CSV pronto da caricare nell'app Shopify. Il cliente:

- **senza account**: va su `/codice`, inserisce il codice e crea lo studio in un unico passaggio;
- **con account esistente**: va su "Abbonamento" nell'app e riscatta il codice per attivare/estendere
  l'abbonamento (i giorni si sommano se l'abbonamento è già attivo).

Ogni codice è utilizzabile una sola volta; un riscatto concorrente sullo stesso codice fallisce in
modo sicuro (transazione atomica).

## Notifiche email e SMS

Una volta al giorno (`vercel.json` → `0 7 * * *`, le 7:00 UTC) l'app controlla scadenze, farmaci e
lotti di magazzino in scadenza o scaduti per ogni studio, e invia un promemoria di riepilogo se c'è
qualcosa da segnalare — via email, via SMS, o entrambi, a seconda di cosa lo studio ha attivato dalla
pagina Impostazioni. Nessun invio se è tutto in regola.

**Email (Resend):**
1. Crea un account gratuito su [resend.com](https://resend.com) e genera una API key.
2. Verifica un dominio mittente (o usa il dominio di test di Resend in fase di prova).
3. Imposta su Vercel: `RESEND_API_KEY`, `EMAIL_FROM` (es. `Scadenze in Regola <notifiche@tuodominio.it>`).

**SMS (Twilio):**
1. Crea un account su [twilio.com](https://www.twilio.com/try-twilio) e attiva un numero di invio.
2. Recupera `Account SID` e `Auth Token` dalla console Twilio.
3. Imposta su Vercel: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` (il numero
   Twilio in formato internazionale, es. `+15551234567`).

**Comune a entrambi:**
- Imposta `CRON_SECRET` (una stringa casuale — Vercel la invia automaticamente come header alle
  chiamate cron, così `/api/cron/digest` rifiuta richieste esterne).
- Ogni studio attiva/disattiva email e SMS separatamente dalla pagina Impostazioni, con un numero di
  cellulare dedicato per gli SMS e pulsanti "Invia di prova ora" per verificare subito che funzioni.

Senza queste variabili l'app funziona lo stesso: il cron job si limita a non fare nulla sui canali
non configurati.

## Scansione codici a barre / QR / DataMatrix

Nei moduli Farmaci e Magazzino, il form "Aggiungi/Modifica" ha un campo di scansione:

- **Lettore esterno (USB o Bluetooth)**: funziona ovunque, su qualsiasi browser — il lettore si comporta
  come una tastiera, quindi basta cliccare nel campo e scansionare.
- **Fotocamera del telefono/computer**: disponibile solo su Chrome (Android o desktop), tramite l'API
  `BarcodeDetector` del browser — Safari/iOS non la supporta, quindi su iPhone va usato un lettore esterno.

Se il codice scansionato è un DataMatrix/GS1-128 (il "bollino" anticontraffazione presente sulle
confezioni dei farmaci italiani), l'app estrae automaticamente lotto e data di scadenza (`src/lib/barcode.ts`).
Per un codice a barre semplice (EAN-13, QR generico) viene comunque salvato il codice, da completare a mano.

## Team e permessi per sezione

Ogni studio ha un titolare più un massimo di 2 collaboratori (da Impostazioni → Team dello studio), tutti con
accesso simultaneo da più dispositivi (telefono, PC, ecc. — è solo una sessione per dispositivo, non un limite
di accessi contemporanei). Per ogni collaboratore il titolare può scegliere quali sezioni mostrare (Scadenzario,
Magazzino, Farmaci, ecc.) tramite le caselle nel modulo di invito o nel pannello "Permessi" della riga del
collaboratore — le sezioni non selezionate (Dashboard inclusa) spariscono dal menu e non sono raggiungibili
nemmeno via URL diretto (`src/lib/modules.ts`, applicato in `requireStudio`/`requireActiveSubscription`).
Abbonamento e Impostazioni (dati account, logout) restano sempre fuori da questa lista: Abbonamento è
owner-only, Impostazioni resta raggiungibile da chiunque per non bloccare mai l'uscita dall'app.

## Personale

Modulo per l'anagrafica dei dipendenti e l'archivio cedolini. **Non è un gestionale HR**: non gestisce
ferie, permessi, ROL, ore lavorate o presenze, e non calcola contributi, TFR o netto in busta. Registra solo
lo stato anagrafico-contrattuale (mansione, tipo contratto, date, ore settimanali) e i valori economici
(stipendio lordo mensile, costo aziendale mensile) inseriti manualmente dal titolare sulla base dei prospetti
del consulente del lavoro.

- **Riepilogo in dashboard**: dipendenti attivi, costo aziendale mensile/annuo, ripartizione del costo per
  mansione (mini-donut) e un badge rosso con le scadenze contrattuali imminenti (finestra 30 giorni, come nel
  resto dell'app).
- **Cedolini**: archivio PDF mese per mese per dipendente, su Vercel Blob. Richiede `BLOB_READ_WRITE_TOKEN`
  (si attiva dal progetto Vercel, sezione Storage → Blob); senza questa variabile l'app funziona lo stesso, il
  caricamento resta solo disabilitato.
- Come gli altri moduli, il titolare può nascondere "Personale" ai singoli collaboratori dal pannello permessi
  in Impostazioni.

## Struttura

- `src/app/(marketing)` — landing page e pricing pubblici (`/`, `/login`, `/signup`)
- `src/app/app/**` — area applicativa protetta (un modulo per ciascuna cartella)
- `src/lib/actions/**` — Server Actions per ogni modulo (CRUD scoping per `studioId`)
- `src/lib/compliance.ts` — logica di calcolo stati (scadenze, scorte, lotti, crediti ECM)
- `prisma/seed.ts` — dati demo che rispecchiano le righe di esempio del foglio originale
