"use client";

import { useActionState } from "react";
import { inviteMember } from "@/lib/actions/team";
import { Field, SubmitButton, FormError } from "@/components/ui/form";
import { ModuleCheckboxes } from "@/components/app/module-checkboxes";

export function InviteMemberForm({ atCap }: { atCap: boolean }) {
  const [state, formAction] = useActionState(inviteMember, undefined);

  if (state?.success) {
    return (
      <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
        {state.success}
      </p>
    );
  }

  // atCap comes from the server render *before* this submission — if this
  // invite is what just filled the last slot, state.success is already set
  // above and takes priority, so the temp password is never lost mid-flow.
  if (atCap) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Hai raggiunto il limite di 2 collaboratori per questo studio. Rimuovi un collaboratore per poterne
        invitare un altro.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nome" name="name" placeholder="Facoltativo" />
        <Field label="Email" name="email" type="email" required placeholder="collega@studiorossi.it" />
      </div>
      <ModuleCheckboxes allowedKeys={null} />
      <FormError error={state?.error} />
      <SubmitButton>Invita collaboratore</SubmitButton>
    </form>
  );
}
