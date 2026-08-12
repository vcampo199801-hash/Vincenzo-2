"use client";

import { useState } from "react";
import { RICORRENZA_TIPO_OPTIONS, RICORRENZA_MENSILE } from "@/lib/spese";

export function RicorrenzaField({
  defaultRicorrenza,
}: {
  defaultRicorrenza?: string | null;
}) {
  const initialTipo =
    !defaultRicorrenza ? "" : defaultRicorrenza === RICORRENZA_MENSILE ? RICORRENZA_MENSILE : "PERSONALIZZATA";
  const [tipo, setTipo] = useState(initialTipo);

  return (
    <div className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">Ricorrenza</span>
        <select
          name="ricorrenzaTipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {RICORRENZA_TIPO_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      {tipo === "PERSONALIZZATA" && (
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Descrivi la ricorrenza</span>
          <input
            name="ricorrenzaPersonalizzata"
            type="text"
            defaultValue={defaultRicorrenza && defaultRicorrenza !== RICORRENZA_MENSILE ? defaultRicorrenza : ""}
            placeholder="Es. Ogni 3 mesi, Annuale a gennaio, Ogni 2 settimane..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </label>
      )}
    </div>
  );
}
