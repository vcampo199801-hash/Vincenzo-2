"use client";

import { useState } from "react";

const NUOVO_TIPO_VALUE = "__NUOVO__";

export function TipoManutenzioneField({ tipi }: { tipi: { chiave: string; nome: string }[] }) {
  const [selezione, setSelezione] = useState(tipi[0]?.chiave ?? NUOVO_TIPO_VALUE);

  return (
    <div className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">Tipo di controllo</span>
        <select
          name="tipoEsistente"
          value={selezione}
          onChange={(e) => setSelezione(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {tipi.map((t) => (
            <option key={t.chiave} value={t.chiave}>
              {t.nome}
            </option>
          ))}
          <option value={NUOVO_TIPO_VALUE}>+ Nuovo tipo personalizzato…</option>
        </select>
      </label>

      {selezione === NUOVO_TIPO_VALUE ? (
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Nome del nuovo tipo</span>
          <input
            name="tipoNuovo"
            type="text"
            placeholder="Es. Controllo aspiratore chirurgico"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <span className="mt-1 block text-xs text-slate-400">
            Verrà aggiunto all&apos;elenco e resterà disponibile per i prossimi controlli.
          </span>
        </label>
      ) : null}
    </div>
  );
}
