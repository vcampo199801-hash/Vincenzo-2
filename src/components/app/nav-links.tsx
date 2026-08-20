"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ModuleKey } from "@/lib/modules";
import { PIANI, type PianoKey } from "@/lib/plans";

const LINKS: { href: string; label: string; icon: string; moduleKey: ModuleKey | null; external?: boolean }[] = [
  { href: "/app", label: "Dashboard", icon: "📊", moduleKey: "dashboard" },
  { href: "/app/scadenzario", label: "Scadenzario", icon: "🗓️", moduleKey: "scadenzario" },
  { href: "/app/controlli", label: "Registro controlli", icon: "🛠️", moduleKey: "controlli" },
  { href: "/app/ecm", label: "Formazione ECM", icon: "🎓", moduleKey: "ecm" },
  { href: "/app/documenti", label: "Documenti", icon: "📁", moduleKey: "documenti" },
  { href: "/app/magazzino", label: "Magazzino", icon: "📦", moduleKey: "magazzino" },
  { href: "/app/farmaci", label: "Farmaci emergenza", icon: "💊", moduleKey: "farmaci" },
  { href: "/app/fornitori", label: "Fornitori", icon: "📇", moduleKey: "fornitori" },
  { href: "/app/report", label: "Report ispezione", icon: "📋", moduleKey: "report" },
  { href: "/app/kpi", label: "KPI Studio", icon: "📈", moduleKey: "kpi" },
  { href: "/app/personale", label: "Personale", icon: "🧑‍⚕️", moduleKey: "personale" },
  { href: "/app/laboratori", label: "Laboratori", icon: "🧪", moduleKey: "laboratori" },
  { href: "/app/comunicazione", label: "Comunicazione Pazienti", icon: "🎬", moduleKey: "comunicazione" },
  { href: "/app/spese", label: "Spese", icon: "💶", moduleKey: "spese" },
  { href: "/app/manutenzione", label: "Manutenzione", icon: "🧯", moduleKey: "manutenzione" },
  { href: "/app/forum", label: "Forum", icon: "💬", moduleKey: "forum" },
  { href: "/app/abbonamento", label: "Abbonamento", icon: "💳", moduleKey: null },
  {
    href: "https://www.sorrisiinregola.com",
    label: "Negozio Sorrisi in Regola",
    icon: "🛍️",
    moduleKey: null,
    external: true,
  },
];

/** allowedKeys null = unrestricted (show everything a collaborator could
 * have access to). piano decide separatamente cosa è incluso nell'abbonamento:
 * una voce non inclusa nel piano resta visibile ma bloccata, con l'etichetta
 * del piano minimo che serve — è la leva principale per far notare cosa si
 * guadagna passando a un piano superiore, invece di nasconderla e basta. */
export function NavLinks({ allowedKeys, piano }: { allowedKeys: ModuleKey[] | null; piano: PianoKey }) {
  const pathname = usePathname();

  const links = LINKS.filter((link) => {
    return !link.moduleKey || allowedKeys === null || allowedKeys.includes(link.moduleKey);
  });

  return (
    <>
      {links.map((link) => {
        if (link.external) {
          return (
            <div key={link.href} className="mt-2 border-t border-slate-100 pt-2">
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
              >
                <span aria-hidden className="inline-flex w-5 shrink-0 justify-center">
                  {link.icon}
                </span>
                <span className="truncate">{link.label}</span>
                <span aria-hidden className="ml-auto shrink-0 text-xs text-slate-400">
                  ↗
                </span>
              </a>
            </div>
          );
        }

        const locked = link.moduleKey ? !PIANI[piano].moduli.includes(link.moduleKey) : false;
        const href = locked ? `/app/abbonamento?upgrade=${link.moduleKey}` : link.href;
        const active = !locked && (link.href === "/app" ? pathname === "/app" : pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={href}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active ? "bg-brand-50 text-brand-700" : locked ? "text-slate-400 hover:bg-slate-100" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span aria-hidden className="inline-flex w-5 shrink-0 justify-center">
              {link.icon}
            </span>
            <span className="truncate">{link.label}</span>
            {locked && (
              <span aria-hidden className="ml-auto shrink-0 text-xs text-slate-400">
                🔒
              </span>
            )}
          </Link>
        );
      })}
    </>
  );
}
