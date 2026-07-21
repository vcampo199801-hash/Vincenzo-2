import Link from "next/link";
import Image from "next/image";
import { requireStudio } from "@/lib/auth-guards";
import { logoutAction } from "@/lib/actions/auth";
import { NavLinks } from "@/components/app/nav-links";
import { InstallAppButton } from "@/components/app/install-app-button";
import { MobileNav } from "@/components/app/mobile-nav";
import { daysUntil } from "@/lib/compliance";
import { parsePermessi } from "@/lib/modules";

// Every route below /app is per-user and session-dependent (auth cookie, tenant
// data, subscription status): it must never be prerendered, statically cached,
// or have its Server Actions cached across requests/sessions.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { studio, membership } = await requireStudio();

  const sub = studio.subscription;
  const showTrialBanner = sub?.status === "TRIALING" && sub.trialEndsAt;
  const trialDaysLeft = showTrialBanner ? Math.max(0, daysUntil(sub!.trialEndsAt)!) : null;
  const allowedKeys = membership.role === "OWNER" ? null : parsePermessi(membership.permessi);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="no-print hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50">
            <Image src="/brand/monogram.png" alt="" width={24} height={24} className="h-6 w-6" />
          </span>
          <div className="leading-tight">
            <span className="block text-base font-semibold text-brand-700">Scadenze in Regola</span>
            <span className="block text-[10px] font-medium text-slate-400">by Sorrisi in Regola</span>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <NavLinks allowedKeys={allowedKeys} />
        </nav>
        <div className="border-t border-slate-200 p-4">
          <p className="truncate text-sm font-medium text-slate-800">{studio.name}</p>
          <p className="truncate text-xs text-slate-500">{studio.email ?? "—"}</p>
          <form action={logoutAction} className="mt-3">
            <button type="submit" className="text-sm font-medium text-slate-500 hover:text-slate-800">
              Esci
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="no-print flex h-16 items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 md:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-2 md:hidden">
            <MobileNav allowedKeys={allowedKeys} />
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50">
              <Image src="/brand/monogram.png" alt="" width={20} height={20} className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1 truncate text-lg font-semibold text-brand-700">Scadenze in Regola</span>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {sub?.status === "TRIALING" && (
              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 sm:px-3">
                <span className="sm:hidden">{trialDaysLeft}gg prova</span>
                <span className="hidden sm:inline">Prova gratuita — {trialDaysLeft} giorni rimanenti</span>
              </span>
            )}
            {sub?.status === "PAST_DUE" && (
              <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 sm:px-3">
                Pagamento non riuscito
              </span>
            )}
            <InstallAppButton />
            <Link
              href="/app/impostazioni"
              title="Impostazioni"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:px-3"
            >
              <span aria-hidden>⚙️</span>
              <span className="hidden sm:inline">Impostazioni</span>
            </Link>
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
