import { requireActiveSubscription } from "@/lib/auth-guards";
import { creaMateriale } from "@/lib/actions/comunicazione";
import { PageHeader } from "@/components/ui/page-header";
import { MaterialeForm } from "@/components/app/materiale-form";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function NuovoMaterialePage() {
  await requireActiveSubscription("comunicazione");

  return (
    <div className="max-w-2xl">
      <PageHeader title="Nuovo materiale informativo" />
      <MaterialeForm action={creaMateriale} />
    </div>
  );
}
