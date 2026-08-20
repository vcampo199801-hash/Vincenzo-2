"use client";

import { useTransition } from "react";
import { setMagazzinoInBilancio } from "@/lib/actions/magazzino";

export function MagazzinoBilancioToggle({ attivo }: { attivo: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <label className={`flex items-center gap-2 text-sm text-slate-600 ${isPending ? "opacity-60" : ""}`}>
      <input
        type="checkbox"
        defaultChecked={attivo}
        onChange={(e) => startTransition(() => setMagazzinoInBilancio(e.target.checked))}
        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
      />
      Includi il Magazzino nel Bilancio generale della Dashboard
    </label>
  );
}
