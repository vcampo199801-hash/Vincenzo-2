"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { scortaStato, formatDate, formatCurrency } from "@/lib/compliance";
import { StatoBadge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/ui/delete-button";
import { regolaQuantita, deleteMagazzinoItem } from "@/lib/actions/magazzino";

/** Riga di magazzino con le frecce +/- per la scorta attuale. Aggiorna il
 * numero, lo stato scorta e il valore giacenza sul momento (nessun ricarico
 * di pagina) — regolaQuantita tocca solo quantitaAttuale, mai la scorta
 * minima, che resta modificabile solo dalla scheda "Modifica". */
export function MagazzinoRow({
  id,
  prodotto,
  fornitore,
  categoria,
  quantitaAttuale: quantitaIniziale,
  scortaMinima,
  unita,
  prezzoUnitario,
  scadenzaLotto,
  lotto,
}: {
  id: string;
  prodotto: string;
  fornitore: string | null;
  categoria: string;
  quantitaAttuale: number;
  scortaMinima: number;
  unita: string;
  prezzoUnitario: number;
  scadenzaLotto: Date | null;
  lotto: string | null;
}) {
  const [quantita, setQuantita] = useState(quantitaIniziale);
  const [isPending, startTransition] = useTransition();

  function aggiorna(delta: number) {
    setQuantita((q) => Math.max(0, q + delta));
    startTransition(() => {
      regolaQuantita(id, delta);
    });
  }

  const stato = scortaStato(scortaMinima, quantita);
  const valore = quantita * prezzoUnitario;

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-3">
        <p className="font-medium text-slate-900">{prodotto}</p>
        {fornitore && <p className="text-xs text-slate-500">{fornitore}</p>}
      </td>
      <td className="px-4 py-3 text-slate-600">{categoria}</td>
      <td className="px-4 py-3 text-slate-600">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => aggiorna(-1)}
            disabled={quantita <= 0}
            aria-label={`Diminuisci scorta attuale di ${prodotto}`}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-slate-300 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
          >
            −
          </button>
          <span className={`min-w-[3.5rem] text-center font-medium tabular-nums ${isPending ? "opacity-60" : ""}`}>
            {quantita} {unita}
          </span>
          <button
            type="button"
            onClick={() => aggiorna(1)}
            aria-label={`Aumenta scorta attuale di ${prodotto}`}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-slate-300 text-slate-500 hover:bg-slate-100"
          >
            +
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-400">Minimo: {scortaMinima} {unita}</p>
      </td>
      <td className="px-4 py-3">
        <StatoBadge stato={stato} />
      </td>
      <td className="px-4 py-3 text-slate-600">{formatDate(scadenzaLotto)}</td>
      <td className="px-4 py-3">
        <StatoBadge stato={lotto} />
      </td>
      <td className="px-4 py-3 text-slate-600">{formatCurrency(valore)}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-3">
          <Link href={`/app/magazzino/${id}/edit`} className="text-sm font-medium text-brand-600 hover:text-brand-800">
            Modifica
          </Link>
          <DeleteButton action={deleteMagazzinoItem.bind(null, id)} />
        </div>
      </td>
    </tr>
  );
}
