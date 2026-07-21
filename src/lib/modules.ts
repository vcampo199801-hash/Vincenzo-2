// The toggleable sections a studio owner can show/hide per collaborator.
// Dashboard/Abbonamento/Impostazioni intentionally stay outside this list —
// billing and account settings are owner-only regardless, and Impostazioni
// (account info, logout) must always stay reachable for every member.

export const APP_MODULES = [
  { key: "dashboard", label: "Dashboard", href: "/app" },
  { key: "scadenzario", label: "Scadenzario", href: "/app/scadenzario" },
  { key: "controlli", label: "Registro controlli", href: "/app/controlli" },
  { key: "ecm", label: "Formazione ECM", href: "/app/ecm" },
  { key: "documenti", label: "Documenti", href: "/app/documenti" },
  { key: "magazzino", label: "Magazzino", href: "/app/magazzino" },
  { key: "farmaci", label: "Farmaci emergenza", href: "/app/farmaci" },
  { key: "fornitori", label: "Fornitori", href: "/app/fornitori" },
  { key: "report", label: "Report ispezione", href: "/app/report" },
  { key: "personale", label: "Personale", href: "/app/personale" },
  { key: "laboratori", label: "Laboratori", href: "/app/laboratori" },
] as const;

export type ModuleKey = (typeof APP_MODULES)[number]["key"];

const MODULE_KEYS = new Set<string>(APP_MODULES.map((m) => m.key));

/** null return = unrestricted (full access) — either the field was never set,
 * or it failed to parse (fail open rather than lock someone out on bad data). */
export function parsePermessi(raw: string | null | undefined): ModuleKey[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((k): k is ModuleKey => typeof k === "string" && MODULE_KEYS.has(k));
  } catch {
    return null;
  }
}

export function hasModuleAccess(permessi: string | null | undefined, role: string, key: ModuleKey): boolean {
  if (role === "OWNER") return true;
  const allowed = parsePermessi(permessi);
  if (allowed === null) return true;
  return allowed.includes(key);
}

export function accessibleModules(permessi: string | null | undefined, role: string) {
  if (role === "OWNER") return APP_MODULES;
  const allowed = parsePermessi(permessi);
  if (allowed === null) return APP_MODULES;
  return APP_MODULES.filter((m) => allowed.includes(m.key));
}

/** Where to send a member who just got blocked from a page they don't have access to. */
export function firstAccessibleHref(permessi: string | null | undefined, role: string): string {
  const modules = accessibleModules(permessi, role);
  return modules[0]?.href ?? "/app/impostazioni";
}
