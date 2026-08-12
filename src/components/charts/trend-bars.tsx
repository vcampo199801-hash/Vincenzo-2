/** Column chart for a time trend (daily/monthly spend, etc). Scrolls horizontally
 * instead of overflowing its container when there are many columns; value labels
 * above each bar are hidden past a threshold to avoid overlapping text. */
export function TrendBars({
  items,
  formatValue = (v: number) => String(v),
  barAreaHeight = 96,
  showValueLabels,
}: {
  items: { label: string; value: number }[];
  formatValue?: (v: number) => string;
  barAreaHeight?: number;
  /** Defaults to true for <=40 columns, false beyond that (labels would overlap). */
  showValueLabels?: boolean;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  const denso = items.length > 40;
  const mostraValori = showValueLabels ?? !denso;
  const larghezzaColonna = denso ? 20 : 44;

  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-2" style={{ minWidth: items.length * larghezzaColonna }}>
        {items.map((item, i) => {
          const h = item.value > 0 ? Math.max(Math.round((item.value / max) * barAreaHeight), 4) : 2;
          return (
            <div key={i} className="flex shrink-0 flex-col items-center gap-1.5" style={{ width: larghezzaColonna }}>
              {mostraValori && (
                <span className="whitespace-nowrap text-xs font-medium tabular-nums text-slate-700">
                  {item.value > 0 ? formatValue(item.value) : "—"}
                </span>
              )}
              <div className="flex items-end" style={{ height: barAreaHeight }}>
                <div className="w-full max-w-8 rounded-t-[4px] bg-brand-500" style={{ height: h }} />
              </div>
              {item.label && <span className="whitespace-nowrap text-[11px] text-slate-500">{item.label}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
