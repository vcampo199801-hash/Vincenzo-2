"use client";

import { useActionState } from "react";
import { updateRecapDestinatarioSezioni } from "@/lib/actions/recap-destinatari";
import { RecapSezioniCheckboxes } from "@/components/app/recap-sezioni-checkboxes";
import { FormError, SubmitButton } from "@/components/ui/form";
import type { RecapSezioneKey } from "@/lib/recap-attivita";

export function RecapDestinatarioSezioniForm({
  destinatarioId,
  allowedKeys,
}: {
  destinatarioId: string;
  allowedKeys: RecapSezioneKey[] | null;
}) {
  const action = updateRecapDestinatarioSezioni.bind(null, destinatarioId);
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-3 border-t border-slate-100 pt-3">
      <RecapSezioniCheckboxes allowedKeys={allowedKeys} />
      <FormError error={state?.error} />
      {state?.success && <p className="text-xs text-emerald-700">{state.success}</p>}
      <SubmitButton>Salva sezioni</SubmitButton>
    </form>
  );
}
