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

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Sequential magnitude encoding, single brand hue, light → dark as ratio
 * (0..1, e.g. value/max) grows — for a bar/column whose color intensity
 * should rise together with its height. */
export function brandSequentialColor(ratio: number): string {
  const t = Math.max(0, Math.min(1, ratio));
  const [lr, lg, lb] = hexToRgb("#a7cdd2"); // brand-300, lightest step
  const [dr, dg, db] = hexToRgb("#3d7076"); // brand-700, darkest step
  return rgbToHex(lr + (dr - lr) * t, lg + (dg - lg) * t, lb + (db - lb) * t);
}
