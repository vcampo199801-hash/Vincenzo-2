"use client";

import { useRouter } from "next/navigation";

/** Tendina per filtrare i preventivi per dottore/commerciale, in base ai nomi
 * già usati fino a quel momento — cambia subito pagina alla selezione, senza
 * bisogno di un pulsante "Applica". Mantiene gli altri filtri già attivi. */
export function PreventiviFiltroPersona({
  paramName,
  valoreAttuale,
  opzioni,
  placeholder,
  currentParams,
}: {
  paramName: string;
  valoreAttuale: string;
  // Un elenco di nomi liberi (dottore, assicurazione...) oppure, per un
  // enum fisso come Tipo di offerta, coppie {value,label} già pronte.
  opzioni: string[] | { value: string; label: string }[];
  placeholder: string;
  currentParams: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const normalizzate = opzioni.map((o) => (typeof o === "string" ? { value: o, label: o } : o));

  return (
    <select
      value={valoreAttuale}
      onChange={(e) => {
        const next = new URLSearchParams();
        for (const [k, v] of Object.entries(currentParams)) {
          if (v) next.set(k, v);
        }
        if (e.target.value) next.set(paramName, e.target.value);
        else next.delete(paramName);
        const qs = next.toString();
        router.push(`/app/kpi/preventivi${qs ? `?${qs}` : ""}`, { scroll: false });
      }}
      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
    >
      <option value="">{placeholder}</option>
      {normalizzate.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
