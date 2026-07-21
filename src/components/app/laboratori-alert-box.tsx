import Link from "next/link";

type ConsegnaAlert = { id: string; riferimentoPaziente: string; laboratorio: string; giorni: number | null; stato: "IN_SCADENZA" | "SCADUTO" };
type DichiarazioneAlert = { id: string; riferimentoPaziente: string; laboratorio: string };
type RegistrazioneAlert = { id: string; ragioneSociale: string };

/** Non compare affatto se non c'è nulla da segnalare. Ogni voce linka alla riga
 * corrispondente nel Registro lavorazioni (o alla scheda del laboratorio). */
export function LaboratoriAlertBox({
  consegneImminenti,
  dichiarazioniMancanti,
  laboratoriDaVerificare,
}: {
  consegneImminenti: ConsegnaAlert[];
  dichiarazioniMancanti: DichiarazioneAlert[];
  laboratoriDaVerificare: RegistrazioneAlert[];
}) {
  const totale = consegneImminenti.length + dichiarazioniMancanti.length + laboratoriDaVerificare.length;
  if (totale === 0) return null;

  return (
    <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
      {consegneImminenti.length > 0 && (
        <div>
          <p className="mb-1.5 text-sm font-semibold text-amber-900">
            ⏰ Consegne scadute o previste entro 7 giorni ({consegneImminenti.length})
          </p>
          <ul className="space-y-1">
            {consegneImminenti.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/app/laboratori/lavorazioni?evidenzia=${c.id}`}
                  className="text-sm text-amber-800 underline hover:text-amber-950"
                >
                  {c.riferimentoPaziente} · {c.laboratorio} —{" "}
                  {c.stato === "SCADUTO" ? `scaduta da ${Math.abs(c.giorni ?? 0)}gg` : `tra ${c.giorni}gg`}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {dichiarazioniMancanti.length > 0 && (
        <div>
          <p className="mb-1.5 text-sm font-semibold text-red-900">
            📄 Dichiarazioni di conformità mancanti su lavorazioni consegnate ({dichiarazioniMancanti.length})
          </p>
          <ul className="space-y-1">
            {dichiarazioniMancanti.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/app/laboratori/lavorazioni?evidenzia=${d.id}`}
                  className="text-sm text-red-800 underline hover:text-red-950"
                >
                  {d.riferimentoPaziente} · {d.laboratorio}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {laboratoriDaVerificare.length > 0 && (
        <div>
          <p className="mb-1.5 text-sm font-semibold text-amber-900">
            🏭 Registrazione ministeriale da verificare da oltre 12 mesi ({laboratoriDaVerificare.length})
          </p>
          <ul className="space-y-1">
            {laboratoriDaVerificare.map((l) => (
              <li key={l.id}>
                <Link href={`/app/laboratori/${l.id}`} className="text-sm text-amber-800 underline hover:text-amber-950">
                  {l.ragioneSociale}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
