"use client";

import { useActionState } from "react";
import { controllaEInviaOra } from "@/lib/actions/admin-prove";

const LABEL: Record<string, string> = {
  nurture: "consiglio a metà prova",
  promemoria: "promemoria -2gg",
  scaduta: "scaduta",
};

export function ControllaOraButton({ studioId }: { studioId: string }) {
  const [state, formAction, pending] = useActionState(controllaEInviaOra, undefined);

  return (
    <form action={formAction} className="mt-2 flex flex-wrap items-center gap-2">
      <input type="hidden" name="studioId" value={studioId} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs font-medium text-brand-700 hover:underline disabled:opacity-50"
      >
        {pending ? "Controllo…" : "Controlla e invia ora"}
      </button>
      {state && "esito" in state && (
        <span className="text-xs text-emerald-700">
          {state.esito ? `Inviata: ${LABEL[state.esito]}` : "Niente da inviare (già tutto inviato, o fuori dalla finestra giusta)"}
        </span>
      )}
      {state && "error" in state && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}
