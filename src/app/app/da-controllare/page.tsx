import Link from "next/link";
import { requireStudio } from "@/lib/auth-guards";
import { buildDigestForStudio, type Digest } from "@/lib/notifications";
import { sezioneApp } from "@/lib/silence-token";
import { PageHeader } from "@/components/ui/page-header";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

const SEZIONI: { key: keyof Digest; titolo: string }[] = [
  { key: "scadenzeUrgenti", titolo: "Scadenze normative" },
  { key: "farmaciUrgenti", titolo: "Farmaci di emergenza" },
  { key: "lottiUrgenti", titolo: "Lotti di magazzino" },
  { key: "scorteBasseUrgenti", titolo: "Scorte di magazzino" },
  { key: "manutenzioniUrgenti", titolo: "Manutenzione staff" },
  { key: "forumUrgenti", titolo: "Forum — nuove risposte" },
];

/** Stessa vista dell'email di riepilogo (buildDigestForStudio), ma navigabile
 * dentro l'app: per chi apre "Apri Scadenze in Regola" dall'email, o clicca il
 * banner in Dashboard, e vuole vedere tutto quello che serve attenzione già
 * diviso per sezione, senza scorrere l'intera Dashboard. Scompare da solo
 * quando non c'è più nulla in sospeso — mostra uno stato positivo, non un
 * errore o una pagina vuota. */
export default async function DaControllarePage() {
  const { studio } = await requireStudio();
  const digest = await buildDigestForStudio(studio.id);

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Da controllare oggi"
        description="Tutto quello che richiede attenzione in questo momento, diviso per sezione."
      />

      {!digest ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <p className="text-3xl">✅</p>
          <p className="mt-2 text-lg font-semibold text-emerald-800">Tutto sotto controllo</p>
          <p className="mt-1 text-sm text-emerald-700">
            Al momento non c&apos;è nessun avviso da gestire. Questa pagina si aggiorna da sola appena qualcosa richiede
            attenzione.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {SEZIONI.map(({ key, titolo }) => {
            const items = digest[key];
            if (items.length === 0) return null;
            return (
              <div key={key} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{titolo}</h2>
                <ul className="mt-3 divide-y divide-slate-100">
                  {items.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={sezioneApp(item.tipo, item.id)}
                        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5 hover:bg-slate-50"
                      >
                        <span className="font-medium text-slate-900">{item.nome}</span>
                        <span className={`text-sm font-medium ${item.scaduto ? "text-red-600" : "text-amber-600"}`}>
                          {item.dettaglioCustom ??
                            (item.scaduto ? `scaduto da ${Math.abs(item.giorni)} giorni` : `scade tra ${item.giorni} giorni`)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
