# Vigilo — by Sorrisi in Regola

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

## Struttura

- `src/app/(marketing)` — landing page e pricing pubblici (`/`, `/login`, `/signup`)
- `src/app/app/**` — area applicativa protetta (un modulo per ciascuna cartella)
- `src/lib/actions/**` — Server Actions per ogni modulo (CRUD scoping per `studioId`)
- `src/lib/compliance.ts` — logica di calcolo stati (scadenze, scorte, lotti, crediti ECM)
- `prisma/seed.ts` — dati demo che rispecchiano le righe di esempio del foglio originale
