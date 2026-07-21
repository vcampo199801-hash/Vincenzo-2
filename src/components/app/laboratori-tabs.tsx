"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/app/laboratori", label: "Laboratori" },
  { href: "/app/laboratori/lavorazioni", label: "Registro lavorazioni" },
];

export function LaboratoriTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 border-b border-slate-200">
      {TABS.map((t) => {
        const active = t.href === "/app/laboratori" ? pathname === "/app/laboratori" : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              active ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
