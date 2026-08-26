"use client";

import { useActionState, useEffect, useState } from "react";
import { inviaComunicazione, type Destinatari } from "@/lib/actions/admin-comunicazioni";
import { Field, TextAreaField, SubmitButton, FormError } from "@/components/ui/form";

const OPZIONI: { value: Destinatari; label: string }[] = [
  { value: "tutti", label: "Tutti gli studi registrati" },
  { value: "attivi", label: "Solo abbonati attivi" },
  { value: "prova", label: "Solo in prova gratuita" },
];

export function ComunicazioneForm({ conteggi }: { conteggi: Record<Destinatari, number> }) {
  const [state, formAction] = useActionState(inviaComunicazione, undefined);
  const [destinatari, setDestinatari] = useState<Destinatari>("tutti");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const numeroDestinatari = conteggi[destinatari];
  const etichetta = OPZIONI.find((o) => o.value === destinatari)!.label;

  useEffect(() => {
    if (state) setConfirmOpen(false);
  }, [state]);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <label className="block min-w-0 text-sm">
        <span className="mb-1 block font-medium text-slate-700">Destinatari</span>
        <select
          name="destinatari"
          value={destinatari}
          onChange={(e) => setDestinatari(e.target.value as Destinatari)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {OPZIONI.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label} ({conteggi[o.value]})
            </option>
          ))}
        </select>
      </label>

      <Field label="Oggetto" name="oggetto" required placeholder="Es. Lo sapevi che puoi installare l'app sul telefono?" />

      <TextAreaField
        label="Messaggio"
        name="messaggio"
        rows={8}
        placeholder="Scrivi qui il testo dell'email. Lascia una riga vuota per andare a capo con un nuovo paragrafo."
        hint="Verrà inviata con l'intestazione e il contatto WhatsApp usati per le altre email di Scadenze in Regola."
      />

      <FormError error={state && "error" in state ? state.error : undefined} />
      {state && "success" in state && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Inviata a {state.sent} studi{state.failed > 0 ? `, ${state.failed} falliti` : ""}.
        </p>
      )}

      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
      >
        Invia
      </button>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg"
          >
            <p className="mb-4 text-sm text-slate-700">
              Stai per inviare questa email a <strong>{numeroDestinatari} studi</strong> ({etichetta}). L&apos;invio
              non è annullabile una volta partito. Confermi?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Annulla
              </button>
              <SubmitButton>Conferma e invia</SubmitButton>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
