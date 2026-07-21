import Link from "next/link";

type ConsegnaAlert = { id: string; riferimentoPaziente: string; laboratorio: string; giorni: number | null; stato: "IN_SCADENZA" | "SCADUTO" };
type DichiarazioneAlert = { id: string; riferimentoPaziente: string; laboratorio: string };
type RegistrazioneAlert = { id: string; ragioneSociale: string };

const TONE = {
  critical: { border: "border-l-red-500", icon: "text-red-600", title: "text-red-900", link: "text-red-800 hover:text-red-950" },
  warning: { border: "border-l-amber-500", icon: "text-amber-600", title: "text-amber-900", link: "text-amber-800 hover:text-amber-950" },
} as const;

function AvvisoCard({
  tone,
  icon,
  title,
  count,
  children,
}: {
  tone: keyof typeof TONE;
  icon: string;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const t = TONE[tone];
  return (
    <div className={`rounded-lg border border-slate-200 border-l-4 ${t.border} bg-white p-3.5 shadow-sm`}>
      <p className={`mb-1.5 flex items-center gap-1.5 text-sm font-semibold ${t.title}`}>
        <span className={t.icon}>{icon}</span>
        {title}
        <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{count}</span>
      </p>
      {children}
    </div>
  );
}

/** Non compare affatto se non c'è nulla da segnalare. Ogni avviso è una card a
 * sé stante (bordo colorato, non un unico blocco pieno) così le tre categorie
 * restano distinte a colpo d'occhio invece di confondersi in un solo box giallo.
 * Ogni voce linka alla riga corrispondente nel Registro lavorazioni (o alla
 * scheda del laboratorio). */
export function LaboratoriAlertBox({
  consegneImminenti,
  dichiarazioniMancanti,
  laboratoriDaVerificare,
}: {
  consegneImminenti: ConsegnaAlert[];
  dichiarazioniMancanti: DichiarazioneAlert[];
  laboratoriDaVerificare: RegistrazioneAlert[];
}) {
  const scadute = consegneImminenti.filter((c) => c.stato === "SCADUTO");
  const inScadenza = consegneImminenti.filter((c) => c.stato === "IN_SCADENZA");
  const totale = consegneImminenti.length + dichiarazioniMancanti.length + laboratoriDaVerificare.length;
  if (totale === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {scadute.length > 0 && (
        <AvvisoCard tone="critical" icon="⏰" title="Consegne scadute" count={scadute.length}>
          <ul className="space-y-1">
            {scadute.map((c) => (
              <li key={c.id}>
                <Link href={`/app/laboratori/lavorazioni?evidenzia=${c.id}`} className={`text-sm underline ${TONE.critical.link}`}>
                  {c.riferimentoPaziente} · {c.laboratorio} — scaduta da {Math.abs(c.giorni ?? 0)}gg
                </Link>
              </li>
            ))}
          </ul>
        </AvvisoCard>
      )}

      {inScadenza.length > 0 && (
        <AvvisoCard tone="warning" icon="⏰" title="Consegne entro 7 giorni" count={inScadenza.length}>
          <ul className="space-y-1">
            {inScadenza.map((c) => (
              <li key={c.id}>
                <Link href={`/app/laboratori/lavorazioni?evidenzia=${c.id}`} className={`text-sm underline ${TONE.warning.link}`}>
                  {c.riferimentoPaziente} · {c.laboratorio} — tra {c.giorni}gg
                </Link>
              </li>
            ))}
          </ul>
        </AvvisoCard>
      )}

      {dichiarazioniMancanti.length > 0 && (
        <AvvisoCard tone="critical" icon="📄" title="Dichiarazioni mancanti" count={dichiarazioniMancanti.length}>
          <ul className="space-y-1">
            {dichiarazioniMancanti.map((d) => (
              <li key={d.id}>
                <Link href={`/app/laboratori/lavorazioni?evidenzia=${d.id}`} className={`text-sm underline ${TONE.critical.link}`}>
                  {d.riferimentoPaziente} · {d.laboratorio}
                </Link>
              </li>
            ))}
          </ul>
        </AvvisoCard>
      )}

      {laboratoriDaVerificare.length > 0 && (
        <AvvisoCard tone="warning" icon="🏭" title="Registrazione da verificare" count={laboratoriDaVerificare.length}>
          <ul className="space-y-1">
            {laboratoriDaVerificare.map((l) => (
              <li key={l.id}>
                <Link href={`/app/laboratori/${l.id}`} className={`text-sm underline ${TONE.warning.link}`}>
                  {l.ragioneSociale}
                </Link>
              </li>
            ))}
          </ul>
        </AvvisoCard>
      )}
    </div>
  );
}
