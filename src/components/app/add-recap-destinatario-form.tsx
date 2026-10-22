"use client";

import { useActionState, useState } from "react";
import { addRecapDestinatario } from "@/lib/actions/recap-destinatari";
import { Field, SubmitButton, FormError } from "@/components/ui/form";
import { RecapSezioniCheckboxes } from "@/components/app/recap-sezioni-checkboxes";

export function AddRecapDestinatarioForm() {
  const [state, formAction] = useActionState(addRecapDestinatario, undefined);
  const [dismissed, setDismissed] = useState(false);

  if (state?.success && !dismissed) {
    return (
      <div className="space-y-2">
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.success}
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-sm font-medium text-brand-700 underline"
        >
          Aggiungi un altro destinatario
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <Field label="Email" name="email" type="email" required placeholder="segreteria@studiorossi.it" />
      <RecapSezioniCheckboxes allowedKeys={null} />
      <FormError error={state?.error} />
      <SubmitButton>Aggiungi destinatario</SubmitButton>
    </form>
  );
}
