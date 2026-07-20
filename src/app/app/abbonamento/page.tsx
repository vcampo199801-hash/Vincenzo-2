import { requireStudio } from "@/lib/auth-guards";
import { isStripeConfigured } from "@/lib/stripe";
import { formatDate } from "@/lib/compliance";
import { startCheckout, openBillingPortal } from "@/lib/actions/billing";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/form";
import { RedeemCodeForm } from "@/components/app/redeem-code-form";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

const PLAN_PRICE_LABEL = process.env.STRIPE_PRICE_LABEL ?? "€12/mese";

export default async function AbbonamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string; error?: string; redeemed?: string }>;
}) {
  const { studio } = await requireStudio();
  const params = await searchParams;
  const sub = studio.subscription;
  const configured = isStripeConfigured();

  const trialActive = sub?.status === "TRIALING" && sub.trialEndsAt && sub.trialEndsAt > new Date();
  const active = sub?.status === "ACTIVE";

  return (
    <div className="max-w-2xl">
      <PageHeader title="Abbonamento" description="Gestisci il piano e la fatturazione dello studio." />

      {params.success && (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Pagamento completato, grazie! L&apos;abbonamento si attiverà a breve.
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
      {params.redeemed && (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Codice riscattato! Il tuo abbonamento è attivo.
        </p>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Piano attuale</p>
            <p className="text-lg font-semibold text-slate-900">Scadenze in Regola — {PLAN_PRICE_LABEL}</p>
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

        <div className="mt-6 flex flex-wrap gap-3">
          {!active && (
            <form action={startCheckout}>
              <SubmitButton>{trialActive ? "Attiva ora l'abbonamento" : "Abbonati — " + PLAN_PRICE_LABEL}</SubmitButton>
            </form>
          )}
          {sub?.stripeCustomerId && (
            <form action={openBillingPortal}>
              <button
                type="submit"
                className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Gestisci fatturazione
              </button>
            </form>
          )}
        </div>

        {!configured && (
          <p className="mt-4 text-xs text-slate-400">
            Nota per lo sviluppatore: imposta STRIPE_SECRET_KEY, STRIPE_PRICE_ID e STRIPE_WEBHOOK_SECRET in .env per abilitare i pagamenti reali.
          </p>
        )}
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
