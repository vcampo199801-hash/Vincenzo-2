"use client";

import { createContext, useCallback, useContext, useEffect, useRef } from "react";

type UnsavedChangesCtx = {
  setDirty: (value: boolean) => void;
  isDirty: () => boolean;
};

const UnsavedChangesContext = createContext<UnsavedChangesCtx | null>(null);

export const MESSAGGIO_MODIFICHE_NON_SALVATE = "Hai modifiche non salvate. Vuoi uscire senza salvare?";

/** Avvisa prima di lasciare una pagina con un form modificato e non
 * inviato — sia chiudendo/ricaricando la scheda (beforeunload) sia
 * cliccando un link o il bottone "Indietro" dentro l'app. Non intercetta il
 * tasto Indietro/Avanti del browser o lo swipe del telefono: per quelli non
 * esiste, in Next.js, un modo affidabile di annullare una navigazione già
 * partita. Montato una sola volta nel layout /app. */
export function UnsavedChangesProvider({ children }: { children: React.ReactNode }) {
  const dirtyRef = useRef(false);

  const setDirty = useCallback((value: boolean) => {
    dirtyRef.current = value;
  }, []);
  const isDirty = useCallback(() => dirtyRef.current, []);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    // Cattura in fase di capture, prima che Next.js gestisca il click sul
    // <Link>: se l'utente conferma di voler uscire, lascia proseguire la
    // navigazione normalmente; altrimenti la blocca sul nascere.
    const onDocumentClick = (e: MouseEvent) => {
      if (!dirtyRef.current) return;
      if (e.defaultPrevented) return;
      const link = (e.target as HTMLElement)?.closest("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      let url: URL;
      try {
        url = new URL(link.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      if (!window.confirm(MESSAGGIO_MODIFICHE_NON_SALVATE)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      dirtyRef.current = false;
    };
    document.addEventListener("click", onDocumentClick, true);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onDocumentClick, true);
    };
  }, []);

  return <UnsavedChangesContext.Provider value={{ setDirty, isDirty }}>{children}</UnsavedChangesContext.Provider>;
}

export function useUnsavedChanges() {
  const ctx = useContext(UnsavedChangesContext);
  if (!ctx) throw new Error("useUnsavedChanges deve stare dentro UnsavedChangesProvider");
  return ctx;
}
