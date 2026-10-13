"use client";

import { useActionState, useEffect, useState } from "react";
import { updateMemberName } from "@/lib/actions/team";
import { FormError } from "@/components/ui/form";

/** Bottone per correggere il nominativo di un collaboratore, senza toccare la
 * sua email di accesso (che resta l'identificativo con cui entra). */
export function EditMemberNameButton({ membershipId, currentName }: { membershipId: string; currentName: string | null }) {
  const action = updateMemberName.bind(null, membershipId);
  const [state, formAction] = useActionState(action, undefined);
  const [editing, setEditing] = useState(false);

  // Dopo un salvataggio riuscito richiudi il form: il nome aggiornato è già
  // visibile nella colonna/riga qui sopra grazie a revalidatePath.
  useEffect(() => {
    if (state?.success) setEditing(false);
  }, [state]);

  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} className="text-sm font-medium text-brand-600 hover:text-brand-800">
        Modifica nome
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        name="name"
        defaultValue={currentName ?? ""}
        placeholder="Nome e cognome"
        className="rounded-lg border border-slate-300 px-2 py-1 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      <button type="submit" className="text-sm font-medium text-emerald-700 hover:text-emerald-900">
        Salva
      </button>
      <button type="button" onClick={() => setEditing(false)} className="text-sm font-medium text-slate-500 hover:text-slate-700">
        Annulla
      </button>
      <FormError error={state?.error} />
    </form>
  );
}
