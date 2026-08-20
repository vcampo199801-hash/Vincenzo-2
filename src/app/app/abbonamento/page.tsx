import { requireStudio } from "@/lib/auth-guards";
import { isPianoConfigured } from "@/lib/stripe";
import { formatDate } from "@/lib/compliance";
import { PIANI, PIANI_ORDINE, normalizzaPiano, pianoMinimoPerModulo, type PianoKey } from "@/lib/plans";
import { APP_MODULES, type ModuleKey } from "@/lib/modules";
import { startCheckout, changePlan, openBillingPortal, estendiProvaSviluppo } from "@/lib/actions/billing";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/form";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function AbbonamentoPage({
  searchParams,
}: {
  searchParams: Promise<{
    success?: string;
    canceled?: string;
    error?: string;
    redeemed?: string;
    upgrade?: string;
  }>;
}) {
  const { studio, membership } = await requireStudio();
  const params = await searchParams;
  const sub = studio.subscription;

  const trialActive = sub?.status === "TRIALING" && sub.trialEndsAt && sub.trialEndsAt > new Date();
  const active = sub?.status === "ACTIVE" || Boolean(trialActive);
  const pianoAttuale: PianoKey | null = sub ? normalizzaPiano(sub.plan) : null;

  const moduloRichiesto = APP_MODULES.find((m) => m.key === params.upgrade);
  const pianoRichiesto = moduloRichiesto ? pianoMinimoPerModulo(moduloRichiesto.key as ModuleKey) : undefined;

  return (
    <div className="max-w-5xl">
      <PageHeader title="Abbonamento" description="Scegli il piano più adatto al tuo studio e gestisci la fatturazione." />

      {params.success && (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Fatto! L&apos;abbonamento si aggiorna a breve.
        </p>
      )}
      {params.canceled && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Pagamento annullato, nessun addebito effettuato.
        </p>
      )}
      {params.error === "stripe-not-configured" && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          I pagamenti non sono ancora configurati su questa istanza. Contatta l&apos;amministratore.
        </p>
      )}
      {params.error === "no-billing-account" && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Non risulta ancora un abbonamento attivo da modificare. Scegli un piano qui sotto.
        </p>
      )}
      {params.error === "piano-non-valido" && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Piano non riconosciuto. Riprova scegliendo uno dei piani qui sotto.
        </p>
      )}
      {params.redeemed && (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Codice riscattato! Il tuo abbonamento è attivo.
        </p>
      )}
      {moduloRichiesto && pianoRichiesto && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Il modulo &laquo;{moduloRichiesto.label}&raquo; richiede il piano {PIANI[pianoRichiesto].label} o superiore.
        </p>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Stato abbonamento</p>
            <p className="text-lg font-semibold text-slate-900">
              {pianoAttuale ? `Piano ${PIANI[pianoAttuale].label}` : "Nessun piano attivo"}
            </p>
          </div>
          <StatusPill status={sub?.status ?? "INCOMPLETE"} />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
          {trialActive && (
            <div>
              <dt className="text-slate-500">Prova gratuita fino al</dt>
              <dd className="font-medium text-slate-900">{formatDate(sub!.trialEndsAt)}</dd>
            </div>
          )}
          {sub?.currentPeriodEnd && (
            <div>
              <dt className="text-slate-500">Prossimo rinnovo</dt>
              <dd className="font-medium text-slate-900">{formatDate(sub.currentPeriodEnd)}</dd>
            </div>
          )}
        </dl>

        {membership.role === "OWNER" && (
          <form action={estendiProvaSviluppo} className="mt-6 border-t border-slate-100 pt-4">
            <p className="mb-2 text-xs text-slate-400">
              Stai ancora allestendo lo studio? Allunga la prova di 30 giorni con accesso a tutti i moduli, senza carta.
            </p>
            <button
              type="submit"
              className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Estendi prova gratuita (+30 giorni)
            </button>
          </form>
        )}
      </div>

      {sub?.stripeCustomerId && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Fatturazione e annullamento</h2>
          <p className="mt-1 text-sm text-slate-500">
            Scarica le fatture, cambia il metodo di pagamento o annulla l&apos;abbonamento in qualsiasi momento — se
            annulli resti comunque attivo fino alla fine del periodo già pagato, nessun rimborso automatico a metà mese.
          </p>
          <form action={openBillingPortal} className="mt-4">
            <button
              type="submit"
              className="inline-flex items-center rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
            >
              Apri fatture, pagamento e annullamento
            </button>
          </form>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {PIANI_ORDINE.map((key) => {
          const piano = PIANI[key];
          const isCurrent = active && pianoAttuale === key;
          const configured = isPianoConfigured(key);

          return (
            <div
              key={key}
              className={`relative flex flex-col rounded-2xl border p-6 shadow-sm ${
                isCurrent || piano.consigliato ? "border-brand-400 ring-2 ring-brand-100" : "border-slate-200"
              } bg-white`}
            >
              {piano.consigliato && !isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                  Consigliato
                </span>
              )}
              <p className="text-sm font-semibold text-brand-700">{piano.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                €{piano.prezzoEuro}
                <span className="text-sm font-medium text-slate-500">/mese</span>
              </p>
              <p className="mt-1 text-xs text-slate-400">IVA inclusa · fatturazione mensile</p>
              <p className="mt-4 text-sm text-slate-600">{piano.descrizione}</p>

              <ul className="mt-4 flex-1 space-y-1.5 text-sm text-slate-600">
                {piano.puntiChiave.map((punto) => (
                  <li key={punto}>✓ {punto}</li>
                ))}
              </ul>

              <div className="mt-6">
                {isCurrent ? (
                  <span className="block rounded-lg bg-brand-50 px-4 py-2 text-center text-sm font-semibold text-brand-700">
                    Piano attuale
                  </span>
                ) : active ? (
                  <form action={changePlan}>
                    <input type="hidden" name="piano" value={key} />
                    <SubmitButton disabled={!configured} className="w-full">
                      Passa a {piano.label}
                    </SubmitButton>
                  </form>
                ) : (
                  <form action={startCheckout}>
                    <input type="hidden" name="piano" value={key} />
                    <SubmitButton disabled={!configured} className="w-full">
                      Abbonati
                    </SubmitButton>
                  </form>
                )}
              </div>

              {!configured && (
                <p className="mt-2 text-center text-xs text-slate-400">Non ancora disponibile.</p>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-center text-sm text-slate-500">
        📄 Ricevi sempre fattura per l&apos;abbonamento: è una spesa deducibile per lo studio. Al primo pagamento ti
        chiediamo Partita IVA e indirizzo di fatturazione — puoi correggerli in qualsiasi momento da{" "}
        <a href="/app/impostazioni" className="underline hover:text-slate-700">Impostazioni</a>.
      </p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    TRIALING: { label: "In prova", className: "bg-brand-50 text-brand-700 border-brand-200" },
    ACTIVE: { label: "Attivo", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    PAST_DUE: { label: "Pagamento scaduto", className: "bg-red-50 text-red-700 border-red-200" },
    CANCELED: { label: "Annullato", className: "bg-slate-100 text-slate-600 border-slate-200" },
    INCOMPLETE: { label: "Da attivare", className: "bg-amber-50 text-amber-700 border-amber-200" },
  };
  const s = map[status] ?? map.INCOMPLETE;
  return <span className={`rounded-full border px-3 py-1 text-xs font-medium ${s.className}`}>{s.label}</span>;
}
