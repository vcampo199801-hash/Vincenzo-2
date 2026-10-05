"use client";

import { useActionState } from "react";
import { resendVerificationEmail } from "@/lib/actions/auth";

export function ResendVerificationForm({ defaultEmail }: { defaultEmail: string }) {
  const [state, formAction] = useActionState(resendVerificationEmail, undefined);

  if (state?.success) {
    return <p className="mt-2 text-sm text-emerald-700">{state.success}</p>;
  }

  return (
    <form action={formAction} className="mt-2 flex flex-wrap items-center gap-2">
      <input type="hidden" name="email" value={defaultEmail} />
      <button type="submit" className="text-sm font-medium text-brand-700 underline hover:text-brand-900">
        Rinvia l&apos;email di conferma
      </button>
      {state?.error && <span className="text-sm text-red-700">{state.error}</span>}
    </form>
  );
}
