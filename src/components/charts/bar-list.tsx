import { BRAND_SEQUENTIAL } from "./colors";

/** Ranked horizontal bar list — magnitude comparison across categories, sequential brand ramp by rank. */
export function BarList({
  items,
  formatValue = (v: number) => String(v),
}: {
  items: { label: string; value: number; color?: string }[];
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={item.label}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
            <span className="truncate text-slate-600">{item.label}</span>
            <span className="shrink-0 font-medium tabular-nums text-slate-900">{formatValue(item.value)}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full"
              style={{
                width: `${Math.max((item.value / max) * 100, item.value > 0 ? 3 : 0)}%`,
                backgroundColor: item.color ?? BRAND_SEQUENTIAL[Math.min(i, BRAND_SEQUENTIAL.length - 1)],
              }}
            />
          </div>
        </li>
      ))}
      {items.length === 0 && <p className="text-sm text-slate-500">Nessun dato disponibile.</p>}
    </ul>
  );
}
