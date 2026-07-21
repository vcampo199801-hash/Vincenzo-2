import { requireStudio } from "@/lib/auth-guards";
import { isPianoConfigured } from "@/lib/stripe";
import { formatDate } from "@/lib/compliance";
import { PIANI, PIANI_ORDINE, normalizzaPiano, pianoMinimoPerModulo, type PianoKey } from "@/lib/plans";
import { APP_MODULES, type ModuleKey } from "@/lib/modules";
import { startCheckout, changePlan, openBillingPortal } from "@/lib/actions/billing";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/form";
import { RedeemCodeForm } from "@/components/app/redeem-code-form";

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
  const { studio } = await requireStudio();
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

        {sub?.stripeCustomerId && (
          <form action={openBillingPortal} className="mt-6">
            <button
              type="submit"
              className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Gestisci fatturazione
            </button>
          </form>
        )}
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {PIANI_ORDINE.map((key) => {
          const piano = PIANI[key];
          const isCurrent = active && pianoAttuale === key;
          const configured = isPianoConfigured(key);
          const moduli = piano.moduli.filter((m) => m !== "dashboard");

          return (
            <div
              key={key}
              className={`flex flex-col rounded-2xl border p-6 shadow-sm ${
                isCurrent ? "border-brand-400 ring-2 ring-brand-100" : "border-slate-200"
              } bg-white`}
            >
              <p className="text-sm font-semibold text-brand-700">{piano.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                €{piano.prezzoEuro}
                <span className="text-sm font-medium text-slate-500">/mese</span>
              </p>
              <p className="mt-1 text-xs text-slate-400">IVA esclusa · fatturazione mensile</p>
              <p className="mt-4 text-sm text-slate-600">{piano.descrizione}</p>

              <ul className="mt-4 flex-1 space-y-1.5 text-sm text-slate-600">
                {moduli.map((m) => {
                  const mod = APP_MODULES.find((x) => x.key === m);
                  return mod ? <li key={m}>✓ {mod.label}</li> : null;
                })}
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

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Hai un codice di attivazione?</p>
        <p className="mt-1 text-sm text-slate-500">
          Se hai acquistato Scadenze in Regola sul nostro shop, inserisci qui il codice ricevuto per
          attivare o estendere l&apos;abbonamento.
        </p>
        <div className="mt-4 max-w-sm">
          <RedeemCodeForm />
        </div>
      </div>
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
