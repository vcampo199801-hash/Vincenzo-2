"use client";

import { useActionState } from "react";
import { updateMemberPermessi } from "@/lib/actions/team";
import { ModuleCheckboxes } from "@/components/app/module-checkboxes";
import { FormError, SubmitButton } from "@/components/ui/form";

export function MemberPermissionsForm({
  membershipId,
  allowedKeys,
}: {
  membershipId: string;
  allowedKeys: string[] | null;
}) {
  const action = updateMemberPermessi.bind(null, membershipId);
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-3 border-t border-slate-100 pt-3">
      <ModuleCheckboxes allowedKeys={allowedKeys} />
      <FormError error={state?.error} />
      {state?.success && <p className="text-xs text-emerald-700">{state.success}</p>}
      <SubmitButton>Salva permessi</SubmitButton>
    </form>
  );
}
