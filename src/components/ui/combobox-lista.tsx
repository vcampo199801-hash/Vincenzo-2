"use client";

import { useState } from "react";

/** Campo "scegli dalla lista o aggiungi nuovo": la prima volta che si scrive
 * un nome (es. un dottore) resta un campo di testo libero; una volta salvato
 * almeno un valore, le volte successive si apre un menù a tendina con tutti
 * i nomi già usati, con in fondo la voce "+ Aggiungi nuovo…" per scriverne
 * uno diverso. Evita che lo stesso nome venga scritto in modi leggermente
 * diversi (spazi, maiuscole) rompendo i report per persona. */
export function ComboboxLista({
  label,
  name,
  opzioni,
  defaultValue,
  required,
  placeholderNuovo = "Scrivi un nome",
  labelVuoto,
}: {
  label: string;
  name: string;
  opzioni: string[];
  defaultValue?: string | null;
  required?: boolean;
  placeholderNuovo?: string;
  labelVuoto?: string;
}) {
  const valoreIniziale = defaultValue ?? "";
  const giaInLista = !valoreIniziale || opzioni.includes(valoreIniziale);
  const [modalitaNuovo, setModalitaNuovo] = useState(opzioni.length === 0 || !giaInLista);

  if (modalitaNuovo) {
    return (
      <label className="block text-sm">
        <span className="mb-1 flex items-center justify-between font-medium text-slate-700">
          <span>
            {label} {required && <span className="text-red-500">*</span>}
          </span>
          {opzioni.length > 0 && (
            <button type="button" onClick={() => setModalitaNuovo(false)} className="text-xs font-medium text-brand-600 hover:underline">
              Scegli dalla lista
            </button>
          )}
        </span>
        <input
          name={name}
          defaultValue={valoreIniziale}
          required={required}
          placeholder={placeholderNuovo}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </label>
    );
  }

  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <select
        name={name}
        defaultValue={valoreIniziale}
        required={required}
        onChange={(e) => {
          if (e.target.value === "__nuovo__") setModalitaNuovo(true);
        }}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      >
        {labelVuoto !== undefined && <option value="">{labelVuoto}</option>}
        {opzioni.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
        <option value="__nuovo__">+ Aggiungi nuovo…</option>
      </select>
    </label>
  );
}
