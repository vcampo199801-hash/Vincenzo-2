"use client";

import { useActionState } from "react";
import { changePassword } from "@/lib/actions/account";
import { Field, SubmitButton, FormError } from "@/components/ui/form";

export function ChangePasswordForm() {
  const [state, formAction] = useActionState(changePassword, undefined);

  return (
    <form action={formAction} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
      <p className="text-sm font-medium text-slate-700">Cambia password</p>
      <Field label="Password attuale" name="passwordAttuale" type="password" required />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Nuova password" name="nuovaPassword" type="password" required placeholder="Almeno 8 caratteri" />
        <Field label="Conferma nuova password" name="conferma" type="password" required />
      </div>
      {state?.success && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.success}</p>
      )}
      <FormError error={state?.error} />
      <SubmitButton>Cambia password</SubmitButton>
    </form>
  );
}
