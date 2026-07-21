type Tono = "completo" | "inCorso" | "daRecuperare";

const TONO_HEX: Record<Tono, string> = { completo: "#10b981", inCorso: "#5a9da5", daRecuperare: "#f59e0b" };
const TONO_LABEL: Record<Tono, string> = { completo: "Completo", inCorso: "In corso", daRecuperare: "Da recuperare" };

/** Colonne appaiate target/raggiunto per categoria (es. un professionista per
 * colonna): il target è sempre neutro, la colonna raggiunta è colorata in
 * base allo stato di avanzamento — un'unica scala, nessun doppio asse. */
export function TargetProgressBars({
  items,
  barAreaHeight = 120,
}: {
  items: { label: string; target: number; raggiunto: number; tono: Tono }[];
  barAreaHeight?: number;
}) {
  const max = Math.max(...items.flatMap((i) => [i.target, i.raggiunto]), 1);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-slate-300" /> Target
        </span>
        {(Object.keys(TONO_HEX) as Tono[]).map((t) => (
          <span key={t} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: TONO_HEX[t] }} /> {TONO_LABEL[t]}
          </span>
        ))}
      </div>

      <div className="flex items-end gap-6 overflow-x-auto pb-1">
        {items.map((item) => {
          const hTarget = item.target > 0 ? Math.max(Math.round((item.target / max) * barAreaHeight), 4) : 2;
          const hRaggiunto = item.raggiunto > 0 ? Math.max(Math.round((item.raggiunto / max) * barAreaHeight), 4) : 2;
          return (
            <div key={item.label} className="flex shrink-0 flex-col items-center gap-1.5">
              <div className="flex items-end gap-1">
                <div className="flex flex-col items-center justify-end" style={{ height: barAreaHeight }}>
                  <span className="mb-1 text-[11px] font-medium tabular-nums text-slate-500">{item.target}</span>
                  <div className="w-6 rounded-t-[4px] bg-slate-300" style={{ height: hTarget }} />
                </div>
                <div className="flex flex-col items-center justify-end" style={{ height: barAreaHeight }}>
                  <span className="mb-1 text-[11px] font-medium tabular-nums text-slate-700">{item.raggiunto}</span>
                  <div className="w-6 rounded-t-[4px]" style={{ height: hRaggiunto, backgroundColor: TONO_HEX[item.tono] }} />
                </div>
              </div>
              <span className="max-w-[6.5rem] truncate text-[11px] text-slate-500" title={item.label}>
                {item.label}
              </span>
            </div>
          );
        })}
        {items.length === 0 && <p className="text-sm text-slate-500">Nessun dato disponibile.</p>}
      </div>
    </div>
  );
}
