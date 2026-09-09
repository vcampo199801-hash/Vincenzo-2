"use client";

import { useActionState, useState } from "react";
import { updateNotificationPreference } from "@/lib/actions/account";
import { Field, SubmitButton, FormError } from "@/components/ui/form";

export function NotificationPreferenceForm({
  defaultChecked,
  defaultEmail,
}: {
  defaultChecked: boolean;
  defaultEmail: string;
}) {
  const [state, formAction] = useActionState(updateNotificationPreference, undefined);
  const [attiva, setAttiva] = useState(defaultChecked);

  return (
    <form action={formAction} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
      <p className="text-sm font-medium text-slate-700">Promemoria scadenze per te</p>
      <p className="text-xs text-slate-500">
        Indipendentemente dall&apos;email principale dello studio, puoi ricevere anche tu il promemoria giornaliero
        di scadenze, farmaci e magazzino su un&apos;email a tua scelta.
      </p>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          name="notificheAttive"
          defaultChecked={defaultChecked}
          onChange={(e) => setAttiva(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
        Ricevi anche tu il promemoria delle scadenze
      </label>
      {attiva && (
        <Field label="Email a cui riceverlo" name="notificheEmail" type="email" defaultValue={defaultEmail} required />
      )}
      {state?.success && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.success}</p>
      )}
      <FormError error={state?.error} />
      <SubmitButton>Salva preferenza</SubmitButton>
    </form>
  );
}
