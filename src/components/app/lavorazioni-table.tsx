"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { updateCampoLavorazione } from "@/lib/actions/laboratori";
import { consegnaStato, optionLabel, STATO_LAVORAZIONE_OPTIONS, STATO_LAVORAZIONE_STYLE, TIPOLOGIA_LAVORAZIONE_OPTIONS } from "@/lib/laboratori";
import { formatDate } from "@/lib/compliance";

export type LavorazioneRow = {
  id: string;
  laboratorioId: string;
  laboratorioNome: string;
  riferimentoPaziente: string;
  tipoLavorazione: string;
  dataInvio: Date;
  dataConsegnaPrevista: Date | null;
  dataConsegnaEffettiva: Date | null;
  stato: string;
  costo: number | null;
  dataConsegnaCopiaPaziente: Date | null;
  hasDichiarazione: boolean;
};

type CampoOrdinabile = "riferimentoPaziente" | "laboratorioNome" | "dataInvio" | "dataConsegnaPrevista" | "stato" | "costo";

function toIsoInput(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

/** Registro lavorazioni: filtri + ricerca lato client (volumi tipici di uno
 * studio singolo), editing inline con salvataggio automatico via server
 * action a ogni modifica di cella. Righe rosse = consegnate senza
 * dichiarazione di conformità, gialle = consegna scaduta o entro 7 giorni. */
export function LavorazioniTable({
  lavorazioni,
  laboratori,
}: {
  lavorazioni: LavorazioneRow[];
  laboratori: { id: string; ragioneSociale: string }[];
}) {
  const searchParams = useSearchParams();
  const evidenzia = searchParams.get("evidenzia");

  const [rows, setRows] = useState(lavorazioni);
  const [filtroLaboratorio, setFiltroLaboratorio] = useState("TUTTI");
  const [filtroStato, setFiltroStato] = useState("TUTTI");
  const [dataDa, setDataDa] = useState("");
  const [dataA, setDataA] = useState("");
  const [ricerca, setRicerca] = useState("");
  const [sort, setSort] = useState<{ campo: CampoOrdinabile; dir: 1 | -1 }>({ campo: "dataInvio", dir: -1 });
  const [, startTransition] = useTransition();
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  useEffect(() => {
    if (evidenzia) {
      rowRefs.current[evidenzia]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [evidenzia]);

  function toggleSort(campo: CampoOrdinabile) {
    setSort((prev) => (prev.campo === campo ? { campo, dir: prev.dir === 1 ? -1 : 1 } : { campo, dir: 1 }));
  }

  function aggiorna(id: string, campo: keyof LavorazioneRow, valore: string) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (campo === "costo") return { ...r, costo: valore ? Number(valore) : null };
        if (campo === "stato") return { ...r, stato: valore };
        return { ...r, [campo]: valore ? new Date(valore) : null };
      })
    );
    startTransition(() => {
      updateCampoLavorazione(id, campo, valore).catch(() => {});
    });
  }

  const risultato = useMemo(() => {
    const filtrate = rows.filter((r) => {
      if (filtroLaboratorio !== "TUTTI" && r.laboratorioId !== filtroLaboratorio) return false;
      if (filtroStato !== "TUTTI" && r.stato !== filtroStato) return false;
      if (dataDa && toIsoInput(r.dataInvio) < dataDa) return false;
      if (dataA && toIsoInput(r.dataInvio) > dataA) return false;
      if (ricerca && !r.riferimentoPaziente.toLowerCase().includes(ricerca.toLowerCase())) return false;
      return true;
    });
    const ordinate = [...filtrate].sort((a, b) => {
      const va = a[sort.campo];
      const vb = b[sort.campo];
      if (va === null && vb === null) return 0;
      if (va === null) return 1;
      if (vb === null) return -1;
      if (va instanceof Date && vb instanceof Date) return (va.getTime() - vb.getTime()) * sort.dir;
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * sort.dir;
      return String(va).localeCompare(String(vb)) * sort.dir;
    });
    return ordinate;
  }, [rows, filtroLaboratorio, filtroStato, dataDa, dataA, ricerca, sort]);

  function SortHeader({ campo, children }: { campo: CampoOrdinabile; children: React.ReactNode }) {
    return (
      <th className="cursor-pointer select-none px-3 py-3 hover:text-slate-700" onClick={() => toggleSort(campo)}>
        {children} {sort.campo === campo && (sort.dir === 1 ? "↑" : "↓")}
      </th>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={filtroLaboratorio}
          onChange={(e) => setFiltroLaboratorio(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
        >
          <option value="TUTTI">Tutti i laboratori</option>
          {laboratori.map((l) => (
            <option key={l.id} value={l.id}>
              {l.ragioneSociale}
            </option>
          ))}
        </select>
        <select
          value={filtroStato}
          onChange={(e) => setFiltroStato(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
        >
          <option value="TUTTI">Tutti gli stati</option>
          {STATO_LAVORAZIONE_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <input type="date" value={dataDa} onChange={(e) => setDataDa(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm" />
        <span className="self-center text-sm text-slate-400">→</span>
        <input type="date" value={dataA} onChange={(e) => setDataA(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm" />
        <input
          type="text"
          placeholder="Cerca paziente..."
          value={ricerca}
          onChange={(e) => setRicerca(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm"
        />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-amber-100" /> Consegna scaduta o entro 7 giorni
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-red-100" /> Consegnata senza dichiarazione di conformità
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <SortHeader campo="riferimentoPaziente">Paziente</SortHeader>
              <SortHeader campo="laboratorioNome">Laboratorio</SortHeader>
              <th className="px-3 py-3">Tipo</th>
              <SortHeader campo="dataInvio">Invio</SortHeader>
              <th className="px-3 py-3">Consegna prevista</th>
              <th className="px-3 py-3">Consegna effettiva</th>
              <SortHeader campo="stato">Stato</SortHeader>
              <SortHeader campo="costo">Costo</SortHeader>
              <th className="px-3 py-3">Copia al paziente</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {risultato.map((r) => {
              const { stato: statoConsegna } = consegnaStato(r.dataConsegnaPrevista, r.dataConsegnaEffettiva);
              const senzaDichiarazione = (r.stato === "CONSEGNATO_STUDIO" || r.stato === "CONSEGNATO_PAZIENTE") && !r.hasDichiarazione;
              const rowClass = senzaDichiarazione ? "bg-red-50 hover:bg-red-100" : statoConsegna !== "OK" ? "bg-amber-50 hover:bg-amber-100" : "hover:bg-slate-50";
              return (
                <tr
                  key={r.id}
                  ref={(el) => {
                    rowRefs.current[r.id] = el;
                  }}
                  className={`${rowClass} ${evidenzia === r.id ? "ring-2 ring-inset ring-brand-500" : ""}`}
                >
                  <td className="px-3 py-2.5">
                    <Link href={`/app/laboratori/lavorazioni/${r.id}`} className="font-medium text-slate-800 hover:text-brand-700">
                      {r.riferimentoPaziente}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">{r.laboratorioNome}</td>
                  <td className="px-3 py-2.5 text-slate-600">{optionLabel(TIPOLOGIA_LAVORAZIONE_OPTIONS, r.tipoLavorazione)}</td>
                  <td className="px-3 py-2.5 text-slate-600">{formatDate(r.dataInvio)}</td>
                  <td className="px-3 py-2.5">
                    <input
                      type="date"
                      defaultValue={toIsoInput(r.dataConsegnaPrevista)}
                      onChange={(e) => aggiorna(r.id, "dataConsegnaPrevista", e.target.value)}
                      className="w-36 rounded border border-slate-200 px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      type="date"
                      defaultValue={toIsoInput(r.dataConsegnaEffettiva)}
                      onChange={(e) => aggiorna(r.id, "dataConsegnaEffettiva", e.target.value)}
                      className="w-36 rounded border border-slate-200 px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <select
                      defaultValue={r.stato}
                      onChange={(e) => aggiorna(r.id, "stato", e.target.value)}
                      className={`rounded border-0 px-2 py-1 text-sm font-medium ${STATO_LAVORAZIONE_STYLE[r.stato] ?? "bg-slate-100 text-slate-600"}`}
                    >
                      {STATO_LAVORAZIONE_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={r.costo ?? ""}
                      onBlur={(e) => aggiorna(r.id, "costo", e.target.value)}
                      className="w-24 rounded border border-slate-200 px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      type="date"
                      defaultValue={toIsoInput(r.dataConsegnaCopiaPaziente)}
                      onChange={(e) => aggiorna(r.id, "dataConsegnaCopiaPaziente", e.target.value)}
                      className="w-36 rounded border border-slate-200 px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Link href={`/app/laboratori/lavorazioni/${r.id}`} className="text-sm font-medium text-brand-600 hover:text-brand-800">
                      Apri
                    </Link>
                  </td>
                </tr>
              );
            })}
            {risultato.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                  Nessuna lavorazione corrisponde ai filtri.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
