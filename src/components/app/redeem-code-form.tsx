"use client";

import { useActionState } from "react";
import { redeemCodeForExistingStudio } from "@/lib/actions/access-code";
import { Field, SubmitButton, FormError } from "@/components/ui/form";

export function RedeemCodeForm() {
  const [state, formAction] = useActionState(redeemCodeForExistingStudio, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <Field label="Codice di attivazione" name="code" required placeholder="SIR-XXXX-XXXX-XXXX" />
      <FormError error={state?.error} />
      <SubmitButton>Riscatta codice</SubmitButton>
    </form>
  );
}
