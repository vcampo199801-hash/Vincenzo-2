"use client";

import { useState } from "react";

/** Ferie/ROL maturati: pre-compilati con la stima calcolata da tipo contratto,
 * ore settimanali e periodo lavorato nell'anno (vedi calcolaMaturazioneAnno).
 * Restano numeri liberamente modificabili; il pulsante permette di tornare
 * alla stima se l'utente li ha corretti a mano e vuole ripartire da lì. */
export function MaturazioneFields({
  ferieIniziale,
  rolIniziale,
  ferieSuggerito,
  rolSuggerito,
}: {
  ferieIniziale: number;
  rolIniziale: number;
  ferieSuggerito: number | null;
  rolSuggerito: number | null;
}) {
  const [ferie, setFerie] = useState(ferieIniziale);
  const [rol, setRol] = useState(rolIniziale);

  return (
    <div className="grid grid-cols-2 gap-4 sm:col-span-2 sm:grid-cols-2">
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">Ferie maturate</span>
        <input
          name="ferieMaturate"
          type="number"
          step="0.5"
          value={ferie}
          onChange={(e) => setFerie(Number(e.target.value))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <span className="mt-1 block text-xs text-slate-400">Giorni di ferie accumulati quest&apos;anno.</span>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">ROL maturati</span>
        <input
          name="rolMaturati"
          type="number"
          step="0.5"
          value={rol}
          onChange={(e) => setRol(Number(e.target.value))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <span className="mt-1 block text-xs text-slate-400">Permessi/riduzione orario di lavoro accumulati.</span>
      </label>
      <div className="sm:col-span-2">
        {ferieSuggerito !== null && rolSuggerito !== null ? (
          <button
            type="button"
            onClick={() => {
              setFerie(ferieSuggerito);
              setRol(rolSuggerito);
            }}
            className="text-xs font-medium text-brand-600 hover:text-brand-800"
          >
            ↻ Usa la stima automatica ({ferieSuggerito} gg ferie, {rolSuggerito} h ROL) calcolata da contratto, ore e
            periodo lavorato
          </button>
        ) : (
          <p className="text-xs text-slate-400">
            Aggiungi la data di assunzione nell&apos;anagrafica per far calcolare qui una stima automatica.
          </p>
        )}
      </div>
    </div>
  );
}
