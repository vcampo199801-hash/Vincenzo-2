"use client";

import { useState } from "react";

/** Conferma con un dialogo interno anziché window.confirm(): in alcuni
 * contesti di navigazione mobile (in-app browser, PWA installata) il
 * confirm() nativo del browser viene bloccato senza avviso, e il pulsante
 * Elimina sembra non fare nulla. */
export function DeleteButton({
  action,
  label = "Elimina",
  confirmMessage = "Confermi l'eliminazione? L'operazione non è reversibile.",
}: {
  action: (formData: FormData) => void;
  label?: string;
  confirmMessage?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-red-600 hover:text-red-800"
      >
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg"
          >
            <p className="mb-4 text-sm text-slate-700">{confirmMessage}</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Annulla
              </button>
              <form action={action}>
                <button
                  type="submit"
                  className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Elimina
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
