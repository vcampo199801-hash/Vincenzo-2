// Modulo Forum: community tra tutti gli studi iscritti all'app (non isolata
// per singolo studio come il resto dei moduli). Ogni studio decide se
// aderire tramite Studio.forumAttivo — vedi requireForumAttivo in
// auth-guards.ts e la pagina /app/forum per il flusso di adesione.

export const CATEGORIA_FORUM_OPTIONS = [
  { value: "DUBBI", label: "Dubbi clinici e gestionali" },
  { value: "CONSIGLI", label: "Consigli tra colleghi" },
  { value: "VENDO", label: "Compravendita attrezzature e materiali" },
  { value: "BACHECA", label: "Bacheca generale" },
] as const;

export type CategoriaForum = (typeof CATEGORIA_FORUM_OPTIONS)[number]["value"];

export function categoriaLabel(categoria: string): string {
  return CATEGORIA_FORUM_OPTIONS.find((c) => c.value === categoria)?.label ?? categoria;
}

/** Sopra questo numero di segnalazioni distinte, un post o commento viene
 * nascosto in automatico in attesa che l'autore lo rimuova: non c'è (ancora)
 * un pannello di moderazione umana, quindi la soglia deve reggere da sola. */
export const SOGLIA_SEGNALAZIONI = 3;

/** Nome con cui uno studio compare nel forum: mai anonimo, sempre la sua
 * identità reale (che è anche ciò che l'utente vede quando decide se
 * aderire). */
export function nomeAutore(studio: { name: string; citta: string | null }): string {
  return studio.citta ? `${studio.name} — ${studio.citta}` : studio.name;
}

export function formatDataOra(date: Date): string {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
