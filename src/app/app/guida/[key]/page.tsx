import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStudio } from "@/lib/auth-guards";
import { voceGuidaPer } from "@/lib/guida";
import { hasModuleAccess, APP_MODULES } from "@/lib/modules";

export default async function GuidaDettaglioPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const { membership } = await requireStudio();

  const voce = voceGuidaPer(key);
  if (!voce || !hasModuleAccess(membership.permessi, membership.role, voce.key)) notFound();

  const modulo = APP_MODULES.find((m) => m.key === voce.key);

  return (
    <div className="max-w-2xl">
      <Link href="/app/guida" className="text-sm text-slate-500 hover:text-slate-800">
        ← Torna alla guida
      </Link>

      <div className="mt-3 flex items-center gap-3">
        <span className="text-3xl" aria-hidden>{voce.icona}</span>
        <h1 className="text-2xl font-semibold text-slate-900">{voce.titolo}</h1>
      </div>
      <p className="mt-2 text-sm text-slate-600">{voce.intro}</p>

      <ul className="mt-6 space-y-3">
        {voce.passi.map((passo, i) => (
          <li key={i} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
            <span className="shrink-0 font-semibold text-brand-600">{i + 1}.</span>
            <span>{passo}</span>
          </li>
        ))}
      </ul>

      {modulo && (
        <Link
          href={modulo.href}
          className="mt-6 inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
        >
          Apri {modulo.label}
        </Link>
      )}
    </div>
  );
}
