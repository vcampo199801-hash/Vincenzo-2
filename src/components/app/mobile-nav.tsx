"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { NavLinks } from "./nav-links";
import type { ModuleKey } from "@/lib/modules";

/** Hamburger + slide-in drawer — the sidebar in AppLayout is hidden below md,
 * so this is the only way to reach the module list (Scadenzario, Magazzino, …) on phones. */
export function MobileNav({ allowedKeys }: { allowedKeys: ModuleKey[] | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Apri il menu"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 md:hidden"
      >
        <span aria-hidden className="text-lg leading-none">
          ☰
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Chiudi il menu"
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[80vw] overflow-y-auto bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-base font-semibold text-brand-700">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Chiudi il menu"
                className="text-xl leading-none text-slate-500 hover:text-slate-800"
              >
                ×
              </button>
            </div>
            <nav className="space-y-1">
              <NavLinks allowedKeys={allowedKeys} />
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
