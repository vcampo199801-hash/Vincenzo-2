"use client";

import { useState, type ReactNode } from "react";

type TabKey = "anagrafica" | "assenze" | "compliance";

const TABS: { key: TabKey; label: string }[] = [
  { key: "anagrafica", label: "Anagrafica & Contratto" },
  { key: "assenze", label: "Assenze & Maturato" },
  { key: "compliance", label: "Compliance Personale" },
];

export function DipendenteTabs({
  anagrafica,
  assenze,
  compliance,
}: {
  anagrafica: ReactNode;
  assenze: ReactNode;
  compliance: ReactNode;
}) {
  const [tab, setTab] = useState<TabKey>("anagrafica");
  const panels: Record<TabKey, ReactNode> = { anagrafica, assenze, compliance };

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {panels[tab]}
    </div>
  );
}
