const METER_TONES = {
  good: { fill: "#10b981", track: "#d1fae5" },
  warn: { fill: "#f59e0b", track: "#fef3c7" },
  bad: { fill: "#dc2626", track: "#fee2e2" },
  brand: { fill: "#4e888f", track: "#e7f2f4" },
} as const;

/** A single ratio against a limit — fill carries severity, track is a lighter step of the same ramp. */
export function Meter({
  label,
  value,
  max,
  tone = "brand",
  valueLabel,
}: {
  label: string;
  value: number;
  max: number;
  tone?: keyof typeof METER_TONES;
  valueLabel?: string;
}) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const t = METER_TONES[tone];
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium tabular-nums text-slate-900">{valueLabel ?? `${Math.round(pct * 100)}%`}</span>
      </div>
      <div className="h-2.5 rounded-full" style={{ backgroundColor: t.track }}>
        <div
          className="h-2.5 rounded-full"
          style={{ width: `${Math.max(pct * 100, pct > 0 ? 3 : 0)}%`, backgroundColor: t.fill }}
        />
      </div>
    </div>
  );
}
