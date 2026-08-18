"use client";

import { useEffect, useRef, useState } from "react";

/** Campo testo con menu a tendina di suggerimenti, ricostruito a mano invece
 * che con <datalist>: Safari su iPhone/iPad non mostra alcun suggerimento
 * per <input list>, quindi su mobile il menu semplicemente non compariva
 * mai. Propone i fornitori già censiti in "Fornitori materiali di
 * consumo", ma resta libero da compilare per un fornitore non ancora
 * registrato. */
export function FornitoreField({
  label = "Fornitore",
  name = "fornitore",
  defaultValue,
  opzioni,
}: {
  label?: string;
  name?: string;
  defaultValue?: string | null;
  opzioni: string[];
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const suggerimenti = opzioni.filter((o) => o.toLowerCase().includes(value.toLowerCase()));

  return (
    <label className="block min-w-0 text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <div ref={wrapperRef} className="relative">
        <input
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Es. Depot Dentale"
          autoComplete="off"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        {open && suggerimenti.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg">
            {suggerimenti.map((o) => (
              <li key={o}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setValue(o);
                    setOpen(false);
                  }}
                  className="block w-full px-3 py-2 text-left hover:bg-brand-50"
                >
                  {o}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {opzioni.length > 0 && (
        <span className="mt-1 block text-xs text-slate-400">Tocca il campo per vedere i fornitori già censiti, oppure scrivi un nome nuovo.</span>
      )}
    </label>
  );
}
