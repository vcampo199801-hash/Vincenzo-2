"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/app", label: "Dashboard", icon: "📊" },
  { href: "/app/scadenzario", label: "Scadenzario", icon: "🗓️" },
  { href: "/app/controlli", label: "Registro controlli", icon: "🛠️" },
  { href: "/app/ecm", label: "Formazione ECM", icon: "🎓" },
  { href: "/app/documenti", label: "Documenti", icon: "📁" },
  { href: "/app/magazzino", label: "Magazzino", icon: "📦" },
  { href: "/app/farmaci", label: "Farmaci emergenza", icon: "💊" },
  { href: "/app/fornitori", label: "Fornitori", icon: "📇" },
  { href: "/app/report", label: "Report ispezione", icon: "📋" },
  { href: "/app/abbonamento", label: "Abbonamento", icon: "💳" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {LINKS.map((link) => {
        const active = link.href === "/app" ? pathname === "/app" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span aria-hidden className="inline-flex w-5 shrink-0 justify-center">
              {link.icon}
            </span>
            <span className="truncate">{link.label}</span>
          </Link>
        );
      })}
    </>
  );
}
