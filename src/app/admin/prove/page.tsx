import { prisma } from "@/lib/prisma";
import { daysUntil, formatDate } from "@/lib/compliance";
import { ControllaOraButton } from "@/components/admin/controlla-ora-button";

export const dynamic = "force-dynamic";

function formatDateTime(date: Date | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
}

function EsitoEmail({ label, inviataAt }: { label: string; inviataAt: Date | null }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${inviataAt ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
      {label}: {inviataAt ? `inviata ${formatDateTime(inviataAt)}` : "non ancora inviata"}
    </span>
  );
}

export default async function ProveGratuitePage() {
  // trialEndsAt non viene mai cancellato dopo la conversione (vedi
  // syncSubscription nel webhook Stripe), quindi resta per sempre la traccia
  // di "questo studio è passato da una prova gratuita" anche a stato ACTIVE
  // o CANCELED — è il modo per ricostruire com'è andata senza uno storico a parte.
  const abbonamenti = await prisma.subscription.findMany({
    where: { trialEndsAt: { not: null } },
    include: { studio: true },
    orderBy: { trialEndsAt: "desc" },
  });

  const inProva = abbonamenti.filter((s) => s.status === "TRIALING");
  const scadonoOggi = inProva.filter((s) => daysUntil(s.trialEndsAt) === 0);
  const inCorso = inProva.filter((s) => (daysUntil(s.trialEndsAt) ?? 0) > 0);
  const scaduteNonConvertite = inProva.filter((s) => (daysUntil(s.trialEndsAt) ?? 0) < 0);
  const convertite = abbonamenti.filter((s) => s.status === "ACTIVE" || s.status === "PAST_DUE");
  const cancellate = abbonamenti.filter((s) => s.status === "CANCELED");

  const Riga = ({ s }: { s: (typeof abbonamenti)[number] }) => {
    const giorni = daysUntil(s.trialEndsAt);
    return (
      <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-slate-900">{s.studio.name}</p>
            <p className="text-xs text-slate-500">{s.studio.email ?? "— nessuna email —"}</p>
          </div>
          <p className="text-xs text-slate-400">
            Scadenza prova: {formatDate(s.trialEndsAt)}
            {giorni !== null && (
              <span className="ml-1">
                ({giorni === 0 ? "oggi" : giorni > 0 ? `tra ${giorni}gg` : `${Math.abs(giorni)}gg fa`})
              </span>
            )}
          </p>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <EsitoEmail label="Benvenuto" inviataAt={s.benvenutoInviatoAt} />
          <EsitoEmail label="Consiglio (metà prova)" inviataAt={s.nurtureTrialInviataAt} />
          <EsitoEmail label="Promemoria (-2gg)" inviataAt={s.promemoriaTrialInviatoAt} />
          <EsitoEmail label="Scaduta" inviataAt={s.scadenzaTrialInviataAt} />
        </div>
        {s.status === "TRIALING" && <ControllaOraButton studioId={s.studioId} />}
      </div>
    );
  };

  const Sezione = ({
    titolo,
    descrizione,
    righe,
    vuoto,
  }: {
    titolo: string;
    descrizione: string;
    righe: typeof abbonamenti;
    vuoto: string;
  }) => (
    <div>
      <h2 className="text-sm font-semibold text-slate-900">
        {titolo} <span className="font-normal text-slate-400">({righe.length})</span>
      </h2>
      <p className="mt-0.5 text-xs text-slate-500">{descrizione}</p>
      <div className="mt-3 space-y-2">
        {righe.length === 0 ? <p className="text-sm text-slate-400">{vuoto}</p> : righe.map((s) => <Riga key={s.id} s={s} />)}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Prove gratuite</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ogni riga mostra se le quattro email del ciclo di vita della prova (benvenuto, consiglio a metà prova,
          promemoria a 2 giorni, avviso di scadenza) sono state effettivamente inviate a quello studio, non solo se
          dovevano esserlo — così puoi verificare caso per caso invece di fidarti solo del riepilogo del cron. Il
          controllo vero gira da solo ogni giorno alle 9:00; su chi è ancora in prova trovi anche &quot;Controlla e
          invia ora&quot; per farlo scattare subito, senza aspettare la prossima esecuzione.
        </p>
      </div>

      <Sezione
        titolo="Scadono oggi"
        descrizione="La prova finisce proprio oggi: qui vedi se l'email di scadenza (mandata il giorno dopo) risulta già inviata da ieri, o se il promemoria dei 2 giorni prima è partito regolarmente."
        righe={scadonoOggi}
        vuoto="Nessuna prova scade oggi."
      />
      <Sezione
        titolo="In corso"
        descrizione="Ancora nei 7 giorni di prova."
        righe={inCorso}
        vuoto="Nessuna prova in corso al momento."
      />
      <Sezione
        titolo="Scadute, non ancora convertite"
        descrizione="Il periodo di prova è già passato e l'app gli blocca l'accesso, ma non hanno ancora scelto un piano: se lo faranno, Stripe li sposta da solo nella sezione qui sotto."
        righe={scaduteNonConvertite}
        vuoto="Nessuna in questo stato."
      />
      <Sezione
        titolo="Convertite in abbonamento"
        descrizione="Hanno scelto un piano e sono clienti paganti (incluso chi ha un pagamento in ritardo)."
        righe={convertite}
        vuoto="Nessuna conversione ancora registrata."
      />
      <Sezione
        titolo="Cancellate"
        descrizione="La prova è finita e non si sono abbonati (o si sono abbonati e poi hanno cancellato)."
        righe={cancellate}
        vuoto="Nessuna cancellazione registrata."
      />
    </div>
  );
}
