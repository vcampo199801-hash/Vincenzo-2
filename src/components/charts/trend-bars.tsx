import { brandSequentialColor, BRAND_TRACK } from "./colors";

/** Column chart for a time trend (daily/monthly spend, etc). Scrolls horizontally
 * instead of overflowing its container when there are many columns. Each column
 * is colored by its own value (sequential brand ramp, light → dark as the amount
 * grows) instead of a flat color, so taller bars also read as "more". Values are
 * never printed above every bar — that overlaps as soon as columns are narrow or
 * numbers are wide — they live in a hover/focus tooltip per bar instead. */
export function TrendBars({
  items,
  formatValue = (v: number) => String(v),
  barAreaHeight = 96,
}: {
  items: { label: string; value: number }[];
  formatValue?: (v: number) => string;
  barAreaHeight?: number;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  const denso = items.length > 40;
  const larghezzaColonna = denso ? 20 : 44;

  return (
    <div className="overflow-x-auto overflow-y-visible">
      <div className="flex items-end gap-2 pt-6" style={{ minWidth: items.length * larghezzaColonna }}>
        {items.map((item, i) => {
          const ratio = item.value > 0 ? item.value / max : 0;
          const h = item.value > 0 ? Math.max(Math.round(ratio * barAreaHeight), 4) : 2;
          const color = item.value > 0 ? brandSequentialColor(ratio) : BRAND_TRACK;
          return (
            <div
              key={i}
              className="group relative flex shrink-0 flex-col items-center gap-1.5 outline-none"
              style={{ width: larghezzaColonna }}
              tabIndex={0}
              aria-label={`${item.label}: ${item.value > 0 ? formatValue(item.value) : "nessun dato"}`}
            >
              <div
                role="tooltip"
                className="pointer-events-none absolute bottom-full z-10 mb-1 hidden whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs font-medium text-white shadow-lg group-hover:block group-focus:block"
              >
                {item.value > 0 ? formatValue(item.value) : "—"}
              </div>
              <div className="flex w-full items-end justify-center" style={{ height: barAreaHeight }}>
                <div
                  className="w-full max-w-8 rounded-t-[4px] transition-[filter] group-hover:brightness-90"
                  style={{ height: h, backgroundColor: color }}
                />
              </div>
              {item.label && <span className="whitespace-nowrap text-[11px] text-slate-500">{item.label}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
