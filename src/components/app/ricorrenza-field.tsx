"use client";

import { useState } from "react";

const PRESET_OPTIONS = [
  { value: "", label: "Nessuna ricorrenza" },
  { value: "1", label: "Mensile" },
  { value: "3", label: "Trimestrale (ogni 3 mesi)" },
  { value: "6", label: "Semestrale (ogni 6 mesi)" },
  { value: "12", label: "Annuale" },
  { value: "custom", label: "Personalizzata" },
];
const PRESET_VALUES = new Set(["1", "3", "6", "12"]);

export function RicorrenzaField({
  defaultRicorrenzaMesi,
  defaultDataFineRicorrenza,
}: {
  defaultRicorrenzaMesi?: number | null;
  defaultDataFineRicorrenza?: string | null;
}) {
  const initial = !defaultRicorrenzaMesi
    ? ""
    : PRESET_VALUES.has(String(defaultRicorrenzaMesi))
      ? String(defaultRicorrenzaMesi)
      : "custom";
  const [selezione, setSelezione] = useState(initial);
  const ricorrente = selezione !== "";

  return (
    <div className="space-y-3">
      <label className="block min-w-0 text-sm">
        <span className="mb-1 block font-medium text-slate-700">Ricorrenza</span>
        <select
          value={selezione}
          onChange={(e) => setSelezione(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {PRESET_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      {selezione === "custom" ? (
        <label className="block min-w-0 text-sm">
          <span className="mb-1 block font-medium text-slate-700">Ogni quanti mesi si ripete?</span>
          <input
            name="ricorrenzaMesi"
            type="number"
            min={1}
            step={1}
            defaultValue={defaultRicorrenzaMesi ?? ""}
            placeholder="Es. 2"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <span className="mt-1 block text-xs text-slate-400">
            Usato per calcolare il costo annuo stimato (importo × 12 / mesi).
          </span>
        </label>
      ) : (
        <input type="hidden" name="ricorrenzaMesi" value={selezione} />
      )}

      {ricorrente && (
        <label className="block min-w-0 text-sm">
          <span className="mb-1 block font-medium text-slate-700">Scadenza (facoltativa)</span>
          <input
            name="dataFineRicorrenza"
            type="date"
            defaultValue={defaultDataFineRicorrenza ?? ""}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <span className="mt-1 block text-xs text-slate-400">
            Se questa spesa va pagata solo per un periodo definito (es. le rate rimaste di un finanziamento o
            leasing), indica qui dopo quale data non la pagherai più. Lascia vuoto se continua senza una scadenza
            (es. affitto, utenze).
          </span>
        </label>
      )}
    </div>
  );
}
