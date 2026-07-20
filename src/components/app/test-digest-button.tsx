"use client";

import { useActionState } from "react";
import { sendTestDigest } from "@/lib/actions/studio";
import { FormError } from "@/components/ui/form";

export function TestDigestButton() {
  const [state, formAction] = useActionState(sendTestDigest, undefined);

  return (
    <form action={formAction} className="space-y-2">
      <button
        type="submit"
        className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Invia email di prova ora
      </button>
      <FormError error={state?.error} />
      {state?.success && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.success}
        </p>
      )}
    </form>
  );
}
