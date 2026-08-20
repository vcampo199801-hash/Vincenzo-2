"use client";

import { useActionState } from "react";
import { inviaRichiestaSupporto } from "@/lib/actions/supporto";
import { TextAreaField, SubmitButton, FormError } from "@/components/ui/form";

export function SupportoForm() {
  const [state, formAction] = useActionState(inviaRichiestaSupporto, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <TextAreaField
        label="Scrivici il tuo dubbio o problema"
        name="messaggio"
        placeholder="Es: non riesco a trovare dove inserire la scadenza dell'estintore..."
      />
      <FormError error={state?.error} />
      {state?.success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.success}
        </p>
      ) : (
        <SubmitButton>Invia</SubmitButton>
      )}
    </form>
  );
}
