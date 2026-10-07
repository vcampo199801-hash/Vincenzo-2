"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/** Campo di ricerca per nome paziente: aggiorna l'URL (quindi filtra anche
 * i totali, il report per persona e l'export CSV) ma con un debounce, così
 * non si naviga ad ogni carattere digitato mentre si scrive. */
export function PreventiviFiltroTesto({
  valoreAttuale,
  currentParams,
}: {
  valoreAttuale: string;
  currentParams: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const [valore, setValore] = useState(valoreAttuale);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValore(valoreAttuale);
  }, [valoreAttuale]);

  function aggiorna(nuovoValore: string) {
    setValore(nuovoValore);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const next = new URLSearchParams();
      for (const [k, v] of Object.entries(currentParams)) {
        if (v) next.set(k, v);
      }
      if (nuovoValore.trim()) next.set("paziente", nuovoValore.trim());
      else next.delete("paziente");
      const qs = next.toString();
      router.push(`/app/kpi/preventivi${qs ? `?${qs}` : ""}`, { scroll: false });
    }, 400);
  }

  return (
    <input
      type="text"
      placeholder="Cerca per nome paziente..."
      value={valore}
      onChange={(e) => aggiorna(e.target.value)}
      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
    />
  );
}
