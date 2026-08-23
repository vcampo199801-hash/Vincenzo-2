"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { NavLinks } from "./nav-links";
import { logoutAction } from "@/lib/actions/auth";
import type { ModuleKey } from "@/lib/modules";
import type { PianoKey } from "@/lib/plans";

/** Hamburger + slide-in drawer — the sidebar in AppLayout is hidden below lg,
 * so this is the only way to reach the module list (Scadenzario, Magazzino, …) and to log out on phones and tablets. */
export function MobileNav({
  allowedKeys,
  piano,
  isAdmin,
  badges,
}: {
  allowedKeys: ModuleKey[] | null;
  piano: PianoKey;
  isAdmin?: boolean;
  badges?: Partial<Record<ModuleKey, number>>;
}) {
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
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
      >
        <span aria-hidden className="text-lg leading-none">
          ☰
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
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
              <NavLinks allowedKeys={allowedKeys} piano={piano} isAdmin={isAdmin} badges={badges} />
            </nav>
            <form action={logoutAction} className="mt-4 border-t border-slate-100 pt-4">
              <button type="submit" className="text-sm font-medium text-slate-500 hover:text-slate-800">
                Esci
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
