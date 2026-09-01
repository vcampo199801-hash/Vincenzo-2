"use client";

import { useActionState, useState } from "react";
import { generaCodiceOmaggio } from "@/lib/actions/admin-codici";
import { Field, SubmitButton, FormError } from "@/components/ui/form";

export function GeneraCodiceForm() {
  const [state, formAction] = useActionState(generaCodiceOmaggio, undefined);
  const [copiato, setCopiato] = useState(false);

  async function copia(codice: string) {
    try {
      await navigator.clipboard.writeText(codice);
      setCopiato(true);
      setTimeout(() => setCopiato(false), 2000);
    } catch {
      // Niente clipboard disponibile (es. contesto non sicuro): il codice è comunque visibile da copiare a mano.
    }
  }

  return (
    <div className="space-y-4">
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <Field label="Giorni" name="giorni" type="number" defaultValue={30} required hint="30 = un mese." />
        <div className="min-w-[200px] flex-1">
          <Field label="Nota (facoltativa)" name="nota" placeholder="Es. Dr. Rossi, richiesto il 31/08" />
        </div>
        <SubmitButton>Genera codice</SubmitButton>
      </form>

      <FormError error={state && "error" in state ? state.error : undefined} />

      {state && "codice" in state && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <div>
            <p className="font-mono text-lg font-semibold text-emerald-900">{state.codice}</p>
            <p className="text-xs text-emerald-700">Vale {state.giorni} giorni di accesso, utilizzabile una sola volta.</p>
          </div>
          <button
            type="button"
            onClick={() => copia(state.codice)}
            className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
          >
            {copiato ? "Copiato!" : "Copia"}
          </button>
        </div>
      )}
    </div>
  );
}
