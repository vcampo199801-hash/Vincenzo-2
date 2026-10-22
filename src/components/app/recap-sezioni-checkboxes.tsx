import { RECAP_SEZIONI, type RecapSezioneKey } from "@/lib/recap-attivita";

/** allowedKeys null = tutte le sezioni (ogni checkbox parte spuntata). */
export function RecapSezioniCheckboxes({ allowedKeys }: { allowedKeys: RecapSezioneKey[] | null }) {
  return (
    <fieldset className="rounded-lg border border-slate-200 p-3">
      <legend className="px-1 text-xs font-medium text-slate-600">Sezioni del recap da ricevere</legend>
      <div className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
        {RECAP_SEZIONI.map((s) => (
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
    </fieldset>
  );
}
