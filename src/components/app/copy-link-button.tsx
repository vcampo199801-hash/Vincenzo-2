"use client";

import { useState } from "react";

export function CopyLinkButton({ url }: { url: string }) {
  const [copiato, setCopiato] = useState(false);

  async function copia() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiato(true);
      setTimeout(() => setCopiato(false), 2000);
    } catch {
      // Clipboard API non disponibile (es. contesto non sicuro): nessuna azione,
      // il link resta comunque visibile e selezionabile a mano.
    }
  }

  return (
    <button
      type="button"
      onClick={copia}
      className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
    >
      {copiato ? "Link copiato ✓" : "Copia link da inviare al paziente"}
    </button>
  );
}
