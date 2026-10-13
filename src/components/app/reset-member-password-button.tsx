"use client";

import { useActionState, useState } from "react";
import { resetMemberPassword } from "@/lib/actions/team";
import { FormError } from "@/components/ui/form";

/** Bottone per rigenerare la password di un collaboratore — utile soprattutto
 * dopo che un invito viene ripetuto per la stessa email (rimuovere non
 * cancella l'account, solo il collegamento allo studio: un nuovo invito
 * ricollega l'account esistente senza generare credenziali nuove). */
export function ResetMemberPasswordButton({ membershipId, email }: { membershipId: string; email: string }) {
  const action = resetMemberPassword.bind(null, membershipId);
  const [state, formAction] = useActionState(action, undefined);
  const [confirming, setConfirming] = useState(false);

  if (state?.success) {
    return <p className="text-xs text-emerald-700">{state.success}</p>;
  }

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="text-sm font-medium text-brand-600 hover:text-brand-800">
        Reimposta password
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-1">
      <p className="text-xs text-slate-500">
        Genera una nuova password temporanea per <strong>{email}</strong> e gliela invia via email. Quella attuale smetterà
        di funzionare.
      </p>
      <div className="flex items-center gap-3">
        <button type="submit" className="text-sm font-medium text-amber-700 hover:text-amber-900">
          Conferma
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="text-sm font-medium text-slate-500 hover:text-slate-700">
          Annulla
        </button>
      </div>
      <FormError error={state?.error} />
    </form>
  );
}
