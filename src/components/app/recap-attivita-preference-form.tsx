"use client";

import { useActionState, useState } from "react";
import { updateRecapAttivitaPreference, sendTestRecapAttivitaPerMe } from "@/lib/actions/account";
import { RecapSezioniCheckboxes } from "@/components/app/recap-sezioni-checkboxes";
import { FormError, SubmitButton } from "@/components/ui/form";
import type { RecapSezioneKey } from "@/lib/recap-attivita";

export function RecapAttivitaPreferenceForm({
  defaultChecked,
  defaultSezioni,
  email,
}: {
  defaultChecked: boolean;
  defaultSezioni: RecapSezioneKey[] | null;
  email: string;
}) {
  const [state, formAction] = useActionState(updateRecapAttivitaPreference, undefined);
  const [testState, testAction] = useActionState(sendTestRecapAttivitaPerMe, undefined);
  const [attiva, setAttiva] = useState(defaultChecked);

  return (
    <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
      <p className="text-sm font-medium text-slate-700">Recap attività per te</p>
      <p className="text-xs text-slate-500">
        Un riepilogo a fine giornata di preventivi caricati, incassi di Cassa e lavorazioni di laboratorio, sulla tua
        email di accesso (<strong>{email}</strong>). Ognuno del team lo attiva per sé, scegliendo quali sezioni
        ricevere — utile per far arrivare solo le informazioni utili a ciascuna area (es. segreteria, laboratorio,
        direzione).
      </p>
      <form action={formAction} className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            name="recapAttivitaAttivo"
            defaultChecked={defaultChecked}
            onChange={(e) => setAttiva(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Ricevi anche tu il recap attività
        </label>
        {attiva && <RecapSezioniCheckboxes allowedKeys={defaultSezioni} />}
        {state?.success && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.success}</p>
        )}
        <FormError error={state?.error} />
        <SubmitButton>Salva preferenza recap</SubmitButton>
      </form>

      {defaultChecked && (
        <form action={testAction} className="space-y-2">
          <button
            type="submit"
            className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Invia recap di prova ora
          </button>
          <FormError error={testState?.error} />
          {testState?.success && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {testState.success}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
