"use client";

import { useActionState } from "react";
import { inviteMember } from "@/lib/actions/team";
import { Field, SubmitButton, FormError } from "@/components/ui/form";

export function InviteMemberForm() {
  const [state, formAction] = useActionState(inviteMember, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nome" name="name" placeholder="Facoltativo" />
        <Field label="Email" name="email" type="email" required placeholder="collega@studiorossi.it" />
      </div>
      <FormError error={state?.error} />
      {state?.success && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.success}
        </p>
      )}
      <SubmitButton>Invita collaboratore</SubmitButton>
    </form>
  );
}
