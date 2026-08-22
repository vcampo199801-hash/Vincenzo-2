"use client";

import { useEffect, useRef } from "react";
import { useUnsavedChanges } from "./unsaved-changes-context";

/** Avvolge un <form> (o qualunque blocco che ne contenga uno) per segnalare
 * al layout quando ci sono modifiche non salvate — senza bisogno di stato
 * controllato sui singoli campi: basta osservare gli eventi input/change
 * del form. display:contents lo rende invisibile al layout, così non altera
 * spaziature/flex/grid della pagina che lo usa. */
export function UnsavedChangesGuard({ children }: { children: React.ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { setDirty } = useUnsavedChanges();

  useEffect(() => {
    const form = wrapperRef.current?.querySelector("form");
    if (!form) return;

    const markDirty = () => setDirty(true);
    const markClean = () => setDirty(false);

    form.addEventListener("input", markDirty);
    form.addEventListener("change", markDirty);
    form.addEventListener("submit", markClean);

    return () => {
      form.removeEventListener("input", markDirty);
      form.removeEventListener("change", markDirty);
      form.removeEventListener("submit", markClean);
      setDirty(false);
    };
  }, [setDirty]);

  return (
    <div ref={wrapperRef} className="contents">
      {children}
    </div>
  );
}
