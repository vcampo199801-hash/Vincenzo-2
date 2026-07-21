"use client";

import { useState } from "react";
import { PERIODICITA_OPTIONS } from "@/lib/compliance";

/** "Periodicità" is just a human-readable label; "Mesi periodicità" is the number
 * that actually drives the deadline countdown. Picking a label here keeps the
 * number in sync automatically, so the two can't silently drift apart — the
 * number stays freely editable afterward for non-standard cadences. */
export function PeriodicitaFields({
  defaultPeriodicita,
  defaultMesi,
}: {
  defaultPeriodicita: string;
  defaultMesi: number;
}) {
  const [mesi, setMesi] = useState(defaultMesi);

  function handlePeriodicitaChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const found = PERIODICITA_OPTIONS.find((p) => p.label === e.target.value);
    if (found) setMesi(found.mesi);
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">Periodicità</span>
        <select
          name="periodicita"
          defaultValue={defaultPeriodicita}
          onChange={handlePeriodicitaChange}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {PERIODICITA_OPTIONS.map((p) => (
            <option key={p.label} value={p.label}>
              {p.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">
          Mesi periodicità <span className="text-red-500">*</span>
        </span>
        <input
          name="mesi"
          type="number"
          required
          value={mesi}
          onChange={(e) => setMesi(Number(e.target.value))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </label>
    </div>
  );
}
