import { APP_MODULES } from "@/lib/modules";

/** allowedKeys null = unrestricted (every box starts checked). */
export function ModuleCheckboxes({ allowedKeys }: { allowedKeys: string[] | null }) {
  return (
    <fieldset className="rounded-lg border border-slate-200 p-3">
      <legend className="px-1 text-xs font-medium text-slate-600">Sezioni visibili</legend>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
        {APP_MODULES.map((m) => (
          <label key={m.key} className="flex items-center gap-1.5 text-sm text-slate-700">
            <input
              type="checkbox"
              name={`modulo_${m.key}`}
              defaultChecked={allowedKeys === null || allowedKeys.includes(m.key)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            {m.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
