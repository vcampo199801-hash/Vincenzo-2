"use client";

import { useActionState, useState } from "react";
import { inviteMember } from "@/lib/actions/team";
import { Field, SubmitButton, FormError } from "@/components/ui/form";
import { ModuleCheckboxes } from "@/components/app/module-checkboxes";

export function InviteMemberForm({ atCap, maxCollaboratori }: { atCap: boolean; maxCollaboratori: number }) {
  const [state, formAction] = useActionState(inviteMember, undefined);
  const [dismissed, setDismissed] = useState(false);

  if (state?.success && !dismissed) {
    return (
      <div className="space-y-2">
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.success}
        </p>
        {!atCap && (
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-sm font-medium text-brand-700 underline"
          >
            Invita un altro collaboratore
          </button>
        )}
      </div>
    );
  }

  // atCap comes from the server render *before* this submission — if this
  // invite is what just filled the last slot, state.success is already set
  // above and takes priority, so the temp password is never lost mid-flow.
  if (atCap) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Hai raggiunto il limite di {maxCollaboratori} collaborator{maxCollaboratori === 1 ? "e" : "i"} per questo
        studio. Rimuovi un collaboratore per poterne invitare un altro, oppure passa a un piano superiore.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Nome" name="name" placeholder="Facoltativo" />
        <Field label="Email" name="email" type="email" required placeholder="collega@studiorossi.it" />
      </div>
      <ModuleCheckboxes allowedKeys={null} />
      <FormError error={state?.error} />
      <SubmitButton>Invita collaboratore</SubmitButton>
    </form>
  );
}
