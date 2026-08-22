"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { registraRiordino } from "@/lib/actions/magazzino";
import { FormError } from "@/components/ui/form";

/** Bottone "+ Riordino" per riga di Magazzino: apre un piccolo popover con
 * quantità e costo (facoltativo), separato dalle frecce +/- rapide così
 * quelle restano immediate per le correzioni al volo. Il costo si precalcola
 * da prezzoUnitario × quantità e si aggiorna da solo finché l'utente non lo
 * tocca a mano — da quel momento resta quello che ha scritto lui. */
export function RegistraRiordinoButton({
  itemId,
  unita,
  prezzoUnitario,
  autoOpen = false,
}: {
  itemId: string;
  unita: string;
  prezzoUnitario: number;
  autoOpen?: boolean;
}) {
  const [open, setOpen] = useState(autoOpen);
  const [quantita, setQuantita] = useState(1);
  const [costo, setCosto] = useState(() => (prezzoUnitario * 1).toFixed(2));
  const [costoPersonalizzato, setCostoPersonalizzato] = useState(false);
  const [state, formAction] = useActionState(registraRiordino.bind(null, itemId), undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setOpen(false);
      setQuantita(1);
      setCosto((prezzoUnitario * 1).toFixed(2));
      setCostoPersonalizzato(false);
    }
  }, [state, prezzoUnitario]);

  function aggiornaQuantita(value: string) {
    setQuantita(Number(value) || 0);
    if (!costoPersonalizzato) {
      setCosto((prezzoUnitario * (Number(value) || 0)).toFixed(2));
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
      >
        + Riordino
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <form ref={formRef} action={formAction} className="space-y-2">
            <label className="block text-xs">
              <span className="mb-1 block font-medium text-slate-700">Quantità aggiunta ({unita})</span>
              <input
                name="quantita"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={quantita}
                onChange={(e) => aggiornaQuantita(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="block text-xs">
              <span className="mb-1 block font-medium text-slate-700">Costo (facoltativo)</span>
              <input
                name="costo"
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                value={costo}
                onChange={(e) => {
                  setCosto(e.target.value);
                  setCostoPersonalizzato(true);
                }}
                className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
              />
              {prezzoUnitario > 0 && (
                <span className="mt-1 block text-[11px] text-slate-400">
                  Calcolato in automatico dal prezzo unitario dell&apos;articolo (€{prezzoUnitario.toFixed(2)}) — cancellalo e
                  scrivi un valore diverso se serve.
                </span>
              )}
            </label>
            <label className="block text-xs">
              <span className="mb-1 block font-medium text-slate-700">Data</span>
              <input
                name="data"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <FormError error={state?.error} />
            <div className="flex items-center gap-2 pt-1">
              <button type="submit" className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700">
                Registra
              </button>
              <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-500 hover:text-slate-800">
                Annulla
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
