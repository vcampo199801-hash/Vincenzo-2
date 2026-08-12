"use client";

import { useState, useTransition } from "react";
import { updateControlloMensile } from "@/lib/actions/farmaci";

export function MonthlyControlRow({
  id,
  mese,
  dataControllo,
  operatore,
  fatto,
  note,
}: {
  id: string;
  mese: string;
  dataControllo: string;
  operatore: string;
  fatto: boolean;
  note: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(dataControllo);
  const [op, setOp] = useState(operatore);
  const [fa, setFa] = useState(fatto);
  const [no, setNo] = useState(note);

  return (
    <tr className={fa ? "bg-emerald-50/60 hover:bg-emerald-50" : "bg-red-50/60 hover:bg-red-50"}>
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
      <td className="px-2 py-2 text-center">
        <input
          type="checkbox"
          checked={fa}
          onChange={(e) => setFa(e.target.checked)}
          aria-label={`Controllo di ${mese} fatto`}
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
      </td>
      <td className="px-2 py-2">
        <input
          type="text"
          value={no}
          onChange={(e) => setNo(e.target.value)}
          placeholder="Note"
          className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
        />
      </td>
      <td className="px-2 py-2 text-right">
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => updateControlloMensile(id, { dataControllo: data, operatore: op, fatto: fa, note: no }))}
          className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-60"
        >
          {isPending ? "…" : "Salva"}
        </button>
      </td>
    </tr>
  );
}
