// Chart color roles, derived from the app's existing brand + status palettes
// (see src/lib/compliance.ts STATO_COLORS and globals.css brand ramp) so
// charts read as the same product as the badges and tiles next to them.

/** Status = state of a single item. Reserved — never reused for categorical series. */
export const STATUS_HEX: Record<string, string> = {
  OK: "#10b981",
  PRESENTE: "#10b981",
  IN_SCADENZA: "#fbbf24",
  SCORTA_BASSA: "#fbbf24",
  DA_AGGIORNARE: "#fbbf24",
  SCADUTO: "#dc2626",
  DA_RIORDINARE: "#dc2626",
  MANCANTE: "#dc2626",
  DA_COMPILARE: "#94a3b8",
};

/** Sequential brand-teal ramp, dark → light. Rank 0 (largest value) gets the darkest step. */
export const BRAND_SEQUENTIAL = ["#3d7076", "#4e888f", "#5a9da5", "#7ab1b8", "#a7cdd2", "#cfe5e7"];

export const BRAND_TRACK = "#e7f2f4";
