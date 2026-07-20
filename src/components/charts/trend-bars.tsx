/** Column chart for a short time trend (e.g. monthly spend) — value on the cap, month on the axis. */
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
  return (
    <div className="flex items-end gap-3">
      {items.map((item) => {
        const h = item.value > 0 ? Math.max(Math.round((item.value / max) * barAreaHeight), 4) : 2;
        return (
          <div key={item.label} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="text-xs font-medium tabular-nums text-slate-700">
              {item.value > 0 ? formatValue(item.value) : "—"}
            </span>
            <div className="flex items-end" style={{ height: barAreaHeight }}>
              <div className="w-full max-w-8 rounded-t-[4px] bg-brand-500" style={{ height: h }} />
            </div>
            <span className="text-[11px] text-slate-500">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
