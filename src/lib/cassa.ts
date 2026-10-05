// ---------- Cassa (incassi, prelievi, versamenti) ----------

export const TIPO_MOVIMENTO_OPTIONS = [
  { value: "INCASSO", label: "Incasso" },
  { value: "PRELIEVO", label: "Prelievo" },
  { value: "VERSAMENTO", label: "Versamento" },
  // Non è un flusso come gli altri tre, ma un conteggio periodico: "quanto
  // contante c'è davvero, fisicamente, in cassa adesso" — serve a controllare
  // che torni con quanto risulta dagli incassi/prelievi/versamenti registrati.
  { value: "FONDO_CASSA", label: "Fondo cassa (conteggio)" },
] as const;
export type TipoMovimento = (typeof TIPO_MOVIMENTO_OPTIONS)[number]["value"];

export const MODALITA_INCASSO_OPTIONS = [
  { value: "CONTANTI", label: "Contanti" },
  { value: "ASSEGNO", label: "Assegno" },
  { value: "BONIFICO", label: "Bonifico" },
  { value: "FINANZIAMENTO", label: "Finanziamento" },
  { value: "PAGODIL", label: "PagoDIL" },
] as const;

export function optionLabelCassa(options: { value: string; label: string }[], value: string | null | undefined) {
  return options.find((o) => o.value === value)?.label ?? value ?? "—";
}
