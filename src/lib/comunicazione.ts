export const CATEGORIA_MATERIALE_OPTIONS = [
  { value: "IGIENE_PREVENZIONE", label: "Igiene e prevenzione" },
  { value: "CONSERVATIVA", label: "Otturazioni / conservativa" },
  { value: "ENDODONZIA", label: "Endodonzia (devitalizzazione)" },
  { value: "CHIRURGIA_ORALE", label: "Chirurgia orale / estrazioni" },
  { value: "IMPLANTOLOGIA", label: "Implantologia" },
  { value: "PROTESI", label: "Protesi" },
  { value: "ORTODONZIA", label: "Ortodonzia" },
  { value: "PARODONTOLOGIA", label: "Parodontologia" },
  { value: "SBIANCAMENTO", label: "Sbiancamento" },
  { value: "PEDODONZIA", label: "Odontoiatria per bambini" },
  { value: "GNATOLOGIA_BITE", label: "Gnatologia / bite" },
  { value: "FACCETTE_ESTETICHE", label: "Faccette estetiche" },
  { value: "ALTRO", label: "Altro" },
];

export function optionLabel(options: { value: string; label: string }[], value: string) {
  return options.find((o) => o.value === value)?.label ?? value;
}

export function isComunicazioneStorageConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** Riconosce URL YouTube/Vimeo comuni e li converte in un src per <iframe> embed.
 * Ritorna null se il link non è riconosciuto (mostreremo comunque un link diretto). */
export function embedVideoUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.pathname === "/watch" ? u.searchParams.get("v") : u.pathname.startsWith("/shorts/") ? u.pathname.split("/")[2] : null;
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}
