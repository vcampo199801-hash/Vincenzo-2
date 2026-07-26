import { notFound } from "next/navigation";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { getTemplate } from "@/lib/modulistica-templates";
import { PageHeader } from "@/components/ui/page-header";
import { ModuloCompilazioneForm } from "@/components/app/modulo-compilazione-form";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function CompilaModuloPage({ params }: { params: Promise<{ id: string; templateKey: string }> }) {
  const { studio } = await requireActiveSubscription("modulistica");
  const { id, templateKey } = await params;

  const paziente = await prisma.paziente.findFirst({ where: { id, studioId: studio.id } });
  if (!paziente) notFound();

  const template = getTemplate(templateKey);
  if (!template) notFound();

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={template.titolo}
        description={`Compilazione per ${paziente.cognome} ${paziente.nome}. Leggi il testo con il paziente prima di far firmare.`}
      />
      <ModuloCompilazioneForm pazienteId={paziente.id} template={template} />
    </div>
  );
}
