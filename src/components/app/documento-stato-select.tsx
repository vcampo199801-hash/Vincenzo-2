"use client";

import { useTransition } from "react";
import { setDocumentoStato } from "@/lib/actions/documenti";

const OPTIONS = [
  { value: "PRESENTE", label: "Presente" },
  { value: "DA_AGGIORNARE", label: "Da aggiornare" },
  { value: "MANCANTE", label: "Mancante" },
];

export function DocumentoStatoSelect({ id, stato }: { id: string; stato: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={stato}
      disabled={isPending}
      onChange={(e) => startTransition(() => setDocumentoStato(id, e.target.value))}
      className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-60"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
