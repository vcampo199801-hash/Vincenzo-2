"use client";

import { useState } from "react";

const NUOVO_TIPO_VALUE = "__NUOVO__";
const AUTOCLAVE_GROUP_VALUE = "__AUTOCLAVE_GROUP__";
const AUTOCLAVE_PREFIX = "AUTOCLAVE_";

/** Tipo di controllo: un menu a tendina piatto per i controlli singoli
 * (lubrificazione manipoli, pulizia aspiratori, eventuali tipi
 * personalizzati), ma l'autoclave è raggruppata sotto una sola voce che,
 * una volta scelta, apre un secondo menu con i singoli test (vacuum test,
 * helix test, indicatore chimico/biologico...) — ognuno con la propria
 * cadenza e il proprio promemoria, gestiti come tipi indipendenti. */
export function TipoManutenzioneField({ tipi }: { tipi: { chiave: string; nome: string }[] }) {
  const tipiAutoclave = tipi.filter((t) => t.chiave.startsWith(AUTOCLAVE_PREFIX));
  const tipiSingoli = tipi.filter((t) => !t.chiave.startsWith(AUTOCLAVE_PREFIX));
  const haAutoclave = tipiAutoclave.length > 0;

  const [categoria, setCategoria] = useState(
    haAutoclave ? AUTOCLAVE_GROUP_VALUE : (tipiSingoli[0]?.chiave ?? NUOVO_TIPO_VALUE)
  );
  const [testAutoclave, setTestAutoclave] = useState(tipiAutoclave[0]?.chiave ?? NUOVO_TIPO_VALUE);

  const inGruppoAutoclave = categoria === AUTOCLAVE_GROUP_VALUE;
  const nuovoTestAutoclave = inGruppoAutoclave && testAutoclave === NUOVO_TIPO_VALUE;
  const nuovoTipoSingolo = !inGruppoAutoclave && categoria === NUOVO_TIPO_VALUE;

  const valoreFinale = inGruppoAutoclave
    ? testAutoclave === NUOVO_TIPO_VALUE
      ? NUOVO_TIPO_VALUE
      : testAutoclave
    : categoria;

  return (
    <div className="space-y-3">
      <input type="hidden" name="tipoEsistente" value={valoreFinale} />
      {(nuovoTestAutoclave || nuovoTipoSingolo) && <input type="hidden" name="prefissoGruppo" value={inGruppoAutoclave ? AUTOCLAVE_PREFIX : ""} />}

      <label className="block min-w-0 text-sm">
        <span className="mb-1 block font-medium text-slate-700">Tipo di controllo</span>
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {haAutoclave && <option value={AUTOCLAVE_GROUP_VALUE}>Controllo autoclave</option>}
          {tipiSingoli.map((t) => (
            <option key={t.chiave} value={t.chiave}>
              {t.nome}
            </option>
          ))}
          <option value={NUOVO_TIPO_VALUE}>+ Nuovo tipo personalizzato…</option>
        </select>
      </label>

      {inGruppoAutoclave && (
        <label className="block min-w-0 text-sm">
          <span className="mb-1 block font-medium text-slate-700">Quale test?</span>
          <select
            value={testAutoclave}
            onChange={(e) => setTestAutoclave(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {tipiAutoclave.map((t) => (
              <option key={t.chiave} value={t.chiave}>
                {t.nome.replace(/^Autoclave — /, "")}
              </option>
            ))}
            <option value={NUOVO_TIPO_VALUE}>+ Nuovo test autoclave…</option>
          </select>
          <span className="mt-1 block text-xs text-slate-400">
            Ogni test ha la sua cadenza e il suo promemoria, impostabili qui sopra nelle schede di riepilogo.
          </span>
        </label>
      )}

      {(nuovoTestAutoclave || nuovoTipoSingolo) && (
        <label className="block min-w-0 text-sm">
          <span className="mb-1 block font-medium text-slate-700">
            {nuovoTestAutoclave ? "Nome del nuovo test autoclave" : "Nome del nuovo tipo"}
          </span>
          <input
            name="tipoNuovo"
            type="text"
            placeholder={nuovoTestAutoclave ? "Es. Test di tenuta camera" : "Es. Controllo aspiratore chirurgico"}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <span className="mt-1 block text-xs text-slate-400">
            Verrà aggiunto all&apos;elenco e resterà disponibile per i prossimi controlli.
          </span>
        </label>
      )}
    </div>
  );
}
