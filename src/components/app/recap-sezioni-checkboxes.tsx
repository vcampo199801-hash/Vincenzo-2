import { RECAP_SEZIONI, type RecapSezioneKey } from "@/lib/recap-attivita";

/** allowedKeys null = tutte le sezioni consentite (ogni checkbox parte
 * spuntata). consentite limita quali sezioni sono addirittura selezionabili,
 * in base ai permessi sui moduli di questo membro (vedi
 * sezioniRecapConsentite) — una sezione non consentita non compare proprio
 * tra le checkbox, non viene solo disabilitata. */
export function RecapSezioniCheckboxes({
  allowedKeys,
  consentite,
}: {
  allowedKeys: RecapSezioneKey[] | null;
  consentite: RecapSezioneKey[];
}) {
  const visibili = RECAP_SEZIONI.filter((s) => consentite.includes(s.key));
  const nonConsentite = RECAP_SEZIONI.filter((s) => !consentite.includes(s.key));

  return (
    <fieldset className="rounded-lg border border-slate-200 p-3">
      <legend className="px-1 text-xs font-medium text-slate-600">Sezioni del recap da ricevere</legend>
      <div className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
        {visibili.map((s) => (
          <label key={s.key} className="flex items-center gap-1.5 text-sm text-slate-700">
            <input
              type="checkbox"
              name={`sezione_${s.key}`}
              defaultChecked={allowedKeys === null || allowedKeys.includes(s.key)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            {s.label}
          </label>
        ))}
      </div>
      {nonConsentite.length > 0 && (
        <p className="mt-2 text-xs text-slate-400">
          Non disponibili: {nonConsentite.map((s) => s.label).join(", ")} — richiedono un accesso che non hai tra le
          tue sezioni dell&apos;app.
        </p>
      )}
    </fieldset>
  );
}
