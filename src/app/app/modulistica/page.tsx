import { requireActiveSubscription } from "@/lib/auth-guards";
import { PageHeader } from "@/components/ui/page-header";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function ModulisticaPage() {
  await requireActiveSubscription("modulistica");

  return (
    <div>
      <PageHeader
        title="Modulistica"
        description="Consensi informati e referti da compilare, firmare e inviare ai pazienti."
      />
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center shadow-sm">
        <p className="text-sm text-slate-500">
          Questa sezione è in costruzione: a breve qui troverai l&apos;anagrafica pazienti e tutti i moduli di
          consenso informato da compilare e firmare digitalmente.
        </p>
      </div>
    </div>
  );
}
