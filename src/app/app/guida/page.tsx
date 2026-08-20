import Link from "next/link";
import { requireStudio } from "@/lib/auth-guards";
import { PageHeader } from "@/components/ui/page-header";
import { SupportoForm } from "@/components/app/supporto-form";
import { GUIDA } from "@/lib/guida";
import { accessibleModules } from "@/lib/modules";

export default async function GuidaPage() {
  const { membership } = await requireStudio();
  const chiaviAccessibili = new Set(accessibleModules(membership.permessi, membership.role).map((m) => m.key));
  const voci = GUIDA.filter((v) => chiaviAccessibili.has(v.key));

  return (
    <div className="max-w-3xl">
      <PageHeader title="Guida e supporto" description="Scegli una sezione per capire come si usa, oppure scrivici direttamente." />

      <a
        href="https://wa.me/393793899831?text=Ciao%2C%20ho%20bisogno%20di%20aiuto%20con%20Scadenze%20in%20Regola"
        target="_blank"
        rel="noopener noreferrer"
        className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm transition-colors hover:border-emerald-300 hover:bg-emerald-100"
      >
        <span className="text-2xl" aria-hidden>💬</span>
        <div>
          <p className="font-medium text-emerald-900">Scrivici su WhatsApp</p>
          <p className="mt-0.5 text-xs text-emerald-700">Risposta rapida per problemi o domande — +39 379 389 9831</p>
        </div>
      </a>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {voci.map((v) => (
          <Link
            key={v.key}
            href={`/app/guida/${v.key}`}
            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-brand-300 hover:shadow-md"
          >
            <span className="text-2xl" aria-hidden>{v.icona}</span>
            <div>
              <p className="font-medium text-slate-900">{v.titolo}</p>
              <p className="mt-0.5 text-xs text-slate-500">{v.intro}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Non trovi quello che cerchi?</h2>
        <p className="mt-1 text-sm text-slate-500">Scrivici il tuo dubbio: ti rispondiamo via email il prima possibile.</p>
        <div className="mt-4">
          <SupportoForm />
        </div>
      </div>
    </div>
  );
}
