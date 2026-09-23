// ---------- Cassa (incassi, prelievi, versamenti) ----------

export const TIPO_MOVIMENTO_OPTIONS = [
  { value: "INCASSO", label: "Incasso" },
  { value: "PRELIEVO", label: "Prelievo" },
  { value: "VERSAMENTO", label: "Versamento" },
] as const;
export type TipoMovimento = (typeof TIPO_MOVIMENTO_OPTIONS)[number]["value"];

export const MODALITA_INCASSO_OPTIONS = [
  { value: "CONTANTI", label: "Contanti" },
  { value: "ASSEGNO", label: "Assegno" },
  { value: "BONIFICO", label: "Bonifico" },
] as const;

export function optionLabelCassa(options: { value: string; label: string }[], value: string | null | undefined) {
  return options.find((o) => o.value === value)?.label ?? value ?? "—";
}
