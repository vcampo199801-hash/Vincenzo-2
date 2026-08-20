"use client";

import { useRouter } from "next/navigation";

/** Torna alla pagina precedente nella cronologia del browser — sempre visibile
 * in alto, così non serve passare dal menu laterale o ricaricare la pagina
 * per tornare indietro. */
export function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Torna indietro"
      title="Torna indietro"
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
    >
      <span aria-hidden className="text-base leading-none">
        ←
      </span>
    </button>
  );
}
