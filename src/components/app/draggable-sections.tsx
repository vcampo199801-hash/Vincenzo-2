"use client";

import { useEffect, useState, type ReactNode } from "react";

/** Griglia di card della dashboard riordinabile dall'utente con le frecce
 * su/giù (più intuitivo e affidabile del drag-and-drop su schermi touch).
 * L'ordine scelto è personale per studio ed è salvato solo nel browser
 * (localStorage): è una preferenza di visualizzazione, non un dato condiviso. */
export function DraggableSections({ studioId, sections }: { studioId: string; sections: { key: string; node: ReactNode }[] }) {
  const storageKey = `dashboard-order-${studioId}`;
  const defaultOrder = sections.map((s) => s.key);
  const [order, setOrder] = useState<string[]>(defaultOrder);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const savedOrder: string[] = JSON.parse(saved);
        const known = new Set(defaultOrder);
        const reconciled = [...savedOrder.filter((k) => known.has(k)), ...defaultOrder.filter((k) => !savedOrder.includes(k))];
        setOrder(reconciled);
      }
    } catch {
      // localStorage non disponibile o dato corrotto: resta l'ordine predefinito
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  function persist(next: string[]) {
    setOrder(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // localStorage non disponibile: la preferenza semplicemente non si salva
    }
  }

  function sposta(key: string, direzione: -1 | 1) {
    const i = order.indexOf(key);
    const j = i + direzione;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    persist(next);
  }

  const nodeByKey = new Map(sections.map((s) => [s.key, s.node]));
  const orderedKeys = order.filter((k) => nodeByKey.has(k));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs text-slate-400">Usa le frecce per riordinare le card come preferisci.</p>
        {orderedKeys.join("|") !== defaultOrder.join("|") && (
          <button
            type="button"
            onClick={() => persist(defaultOrder)}
            className="shrink-0 text-xs font-medium text-slate-500 hover:text-brand-600"
          >
            Ripristina ordine predefinito
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {orderedKeys.map((key, i) => (
          <div key={key}>
            <div className="mb-2 flex items-center justify-end gap-1.5 rounded-lg bg-slate-100/80 px-2 py-1.5">
              <span className="mr-auto text-xs font-medium text-slate-500">Sposta</span>
              <button
                type="button"
                onClick={() => sposta(key, -1)}
                disabled={i === 0}
                aria-label="Sposta su"
                title="Sposta su"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-base font-semibold text-slate-600 shadow-sm hover:border-brand-300 hover:text-brand-600 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-300"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => sposta(key, 1)}
                disabled={i === orderedKeys.length - 1}
                aria-label="Sposta giù"
                title="Sposta giù"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-base font-semibold text-slate-600 shadow-sm hover:border-brand-300 hover:text-brand-600 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-300"
              >
                ↓
              </button>
            </div>
            {nodeByKey.get(key)}
          </div>
        ))}
      </div>
    </div>
  );
}
