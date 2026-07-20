"use client";

import { useState, useTransition } from "react";
import { updateControlloMensile } from "@/lib/actions/farmaci";

export function MonthlyControlRow({
  id,
  mese,
  dataControllo,
  operatore,
  esito,
}: {
  id: string;
  mese: string;
  dataControllo: string;
  operatore: string;
  esito: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(dataControllo);
  const [op, setOp] = useState(operatore);
  const [es, setEs] = useState(esito);

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-2 font-medium text-slate-800">{mese}</td>
      <td className="px-2 py-2">
        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
        />
      </td>
      <td className="px-2 py-2">
        <input
          type="text"
          value={op}
          onChange={(e) => setOp(e.target.value)}
          placeholder="Operatore"
          className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
        />
      </td>
      <td className="px-2 py-2">
        <input
          type="text"
          value={es}
          onChange={(e) => setEs(e.target.value)}
          placeholder="Esito / note"
          className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
        />
      </td>
      <td className="px-2 py-2 text-right">
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => updateControlloMensile(id, { dataControllo: data, operatore: op, esito: es }))}
          className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-60"
        >
          {isPending ? "…" : "Salva"}
        </button>
      </td>
    </tr>
  );
}
