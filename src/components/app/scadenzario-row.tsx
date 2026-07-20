"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { markAdempimentoDone } from "@/lib/actions/scadenzario";
import { StatoBadge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/ui/delete-button";
import { deleteAdempimento } from "@/lib/actions/scadenzario";
import { formatDate } from "@/lib/compliance";

export function ScadenzarioRow({
  id,
  nome,
  riferimento,
  periodicita,
  dataUltimoControllo,
  prossimaScadenza,
  giorni,
  stato,
}: {
  id: string;
  nome: string;
  riferimento: string | null;
  periodicita: string;
  dataUltimoControllo: Date | null;
  prossimaScadenza: Date | null;
  giorni: number | null;
  stato: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const today = new Date().toISOString().slice(0, 10);
  const [data, setData] = useState(today);
  const [tecnico, setTecnico] = useState("");
  const [costo, setCosto] = useState("");
  const [esito, setEsito] = useState("Conforme");

  function confirm() {
    startTransition(async () => {
      await markAdempimentoDone(id, { data, tecnico, costo, esito, note: "" });
      setOpen(false);
      setTecnico("");
      setCosto("");
    });
  }

  return (
    <>
      <tr className="hover:bg-slate-50">
        <td className="px-4 py-3">
          <p className="font-medium text-slate-900">{nome}</p>
          {riferimento && <p className="text-xs text-slate-500">{riferimento}</p>}
        </td>
        <td className="px-4 py-3 text-slate-600">{periodicita}</td>
        <td className="px-4 py-3 text-slate-600">{formatDate(dataUltimoControllo)}</td>
        <td className="px-4 py-3 text-slate-600">{formatDate(prossimaScadenza)}</td>
        <td className="px-4 py-3 text-slate-600">{giorni ?? "—"}</td>
        <td className="px-4 py-3">
          <StatoBadge stato={stato} />
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="rounded-lg bg-brand-50 px-2.5 py-1 text-sm font-medium text-brand-700 hover:bg-brand-100"
            >
              {open ? "Chiudi" : "Segna eseguito"}
            </button>
            <Link href={`/app/scadenzario/${id}/edit`} className="text-sm font-medium text-brand-600 hover:text-brand-800">
              Modifica
            </Link>
            <DeleteButton action={deleteAdempimento.bind(null, id)} />
          </div>
        </td>
      </tr>
      {open && (
        <tr className="bg-brand-50/40">
          <td colSpan={7} className="px-4 py-3">
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Data intervento</span>
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Fornitore / Tecnico</span>
                <input
                  type="text"
                  value={tecnico}
                  onChange={(e) => setTecnico(e.target.value)}
                  placeholder="Facoltativo"
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Costo (€)</span>
                <input
                  type="number"
                  step="0.01"
                  value={costo}
                  onChange={(e) => setCosto(e.target.value)}
                  placeholder="0"
                  className="w-24 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-700">Esito</span>
                <select
                  value={esito}
                  onChange={(e) => setEsito(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
                >
                  <option value="Conforme">Conforme</option>
                  <option value="Con prescrizioni">Con prescrizioni</option>
                  <option value="Non conforme">Non conforme</option>
                </select>
              </label>
              <button
                type="button"
                disabled={isPending}
                onClick={confirm}
                className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700 disabled:opacity-60"
              >
                {isPending ? "Salvataggio…" : "Conferma"}
              </button>
              <p className="w-full text-xs text-slate-500">
                Aggiorna la scadenza a oggi e registra l&apos;intervento nel Registro controlli, in un solo passaggio.
              </p>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
