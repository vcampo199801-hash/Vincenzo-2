import { STATO_COLORS, STATO_LABELS } from "@/lib/compliance";

export function StatoBadge({ stato }: { stato: string | null }) {
  if (!stato) {
    return (
      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-500">
        —
      </span>
    );
  }
  const color = STATO_COLORS[stato] ?? "bg-slate-100 text-slate-600 border-slate-200";
  const label = STATO_LABELS[stato] ?? stato;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${color}`}>
      {label}
    </span>
  );
}
