"use client";

import { useActionState } from "react";
import { correggiEmailStudiMancanti } from "@/lib/actions/admin-comunicazioni";
import { SubmitButton } from "@/components/ui/form";

export function CorreggiEmailButton({ mancanti }: { mancanti: number }) {
  const [state, formAction] = useActionState(correggiEmailStudiMancanti, undefined);

  if (mancanti === 0) return null;

  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="text-sm text-amber-900">
        <strong>{mancanti} studi</strong> non hanno un&apos;email dello studio salvata: non ricevono promemoria di
        scadenza prova, digest né comunicazioni come questa, finché non viene impostata (di solito perché si sono
        registrati prima che venisse salvata in automatico).
      </p>
      <form action={formAction} className="mt-2">
        <SubmitButton className="bg-amber-600 hover:bg-amber-700">
          Usa l&apos;email del titolare per correggerli
        </SubmitButton>
      </form>
      {state && (
        <p className="mt-2 text-sm text-amber-900">
          Corretti {state.corretti} studi.
          {state.senzaProprietario > 0 ? ` ${state.senzaProprietario} senza email nemmeno sul titolare.` : ""}
        </p>
      )}
    </div>
  );
}
