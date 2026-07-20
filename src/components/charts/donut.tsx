type DonutSegment = { label: string; value: number; color: string };

/** Multi-segment ring chart for a status breakdown, with an optional headline number in the center. */
export function StatusDonut({
  segments,
  size = 148,
  strokeWidth = 20,
  centerValue,
  centerLabel,
}: {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerValue?: string;
  centerLabel?: string;
}) {
  const total = segments.reduce((sum, seg) => sum + seg.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulative = 0;
  const arcs = segments
    .filter((seg) => seg.value > 0)
    .map((seg) => {
      const fraction = seg.value / total;
      const dash = fraction * circumference;
      const rotation = (cumulative / total) * 360;
      cumulative += seg.value;
      return { ...seg, dash, rotation };
    });

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#eef2f6" strokeWidth={strokeWidth} />
          {total > 0 &&
            arcs.map((arc) => (
              <circle
                key={arc.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={arc.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${Math.max(arc.dash - 2, 0)} ${circumference}`}
                style={{ transform: `rotate(${arc.rotation}deg)`, transformOrigin: "50% 50%" }}
              />
            ))}
        </svg>
        {(centerValue || centerLabel) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerValue && <span className="text-2xl font-semibold text-slate-900">{centerValue}</span>}
            {centerLabel && <span className="text-[11px] text-slate-500">{centerLabel}</span>}
          </div>
        )}
      </div>
      <ul className="space-y-1.5 text-sm">
        {segments.map((seg) => (
          <li key={seg.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-slate-600">{seg.label}</span>
            <span className="ml-auto pl-3 font-medium tabular-nums text-slate-900">{seg.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
