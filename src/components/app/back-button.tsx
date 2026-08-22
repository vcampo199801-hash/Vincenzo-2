"use client";

import { useRouter, usePathname } from "next/navigation";
import { useUnsavedChanges, MESSAGGIO_MODIFICHE_NON_SALVATE } from "./unsaved-changes-context";

/** Torna alla pagina precedente nella cronologia del browser — visibile in
 * alto in ogni pagina TRANNE la Dashboard: appena dopo il login si atterra
 * lì e non c'è ancora nessuna cronologia in-app a cui tornare, quindi la
 * freccia comparirebbe senza motivo. Ricompare non appena si apre una
 * qualsiasi altra sezione. */
export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { isDirty, setDirty } = useUnsavedChanges();

  if (pathname === "/app") return null;

  function handleClick() {
    if (isDirty() && !window.confirm(MESSAGGIO_MODIFICHE_NON_SALVATE)) return;
    setDirty(false);
    router.back();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
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
