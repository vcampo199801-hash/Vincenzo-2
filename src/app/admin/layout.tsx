import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

const TABS = [
  { href: "/admin", label: "Andamento" },
  { href: "/admin/prove", label: "Prove gratuite" },
  { href: "/admin/fatturazione", label: "Fatturazione" },
  { href: "/admin/supporto", label: "Supporto" },
  { href: "/admin/comunicazioni", label: "Comunicazioni" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-1 px-6 py-3">
          <span className="mr-4 text-sm font-semibold text-brand-700">Area titolare</span>
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              {t.label}
            </Link>
          ))}
          <Link href="/app" className="ml-auto text-sm text-slate-400 hover:text-slate-700">
            Torna all&apos;app →
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
