import { prisma } from "@/lib/prisma";
import { ComunicazioneForm } from "@/components/admin/comunicazione-form";
import type { Destinatari } from "@/lib/actions/admin-comunicazioni";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function ComunicazioniPage() {
  const [tutti, attivi, prova] = await Promise.all([
    prisma.studio.count({ where: { email: { not: null } } }),
    prisma.studio.count({ where: { email: { not: null }, subscription: { status: "ACTIVE" } } }),
    prisma.studio.count({ where: { email: { not: null }, subscription: { status: "TRIALING" } } }),
  ]);

  const conteggi: Record<Destinatari, number> = { tutti, attivi, prova };

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="text-xl font-semibold text-slate-900">Comunicazione agli iscritti</h1>
      <p className="mt-1 text-sm text-slate-500">
        Invia un&apos;email una tantum a chi è registrato — per annunci che non sono scadenze o avvisi
        sull&apos;abbonamento (es. un consiglio d&apos;uso, una nuova funzionalità).
      </p>
      <ComunicazioneForm conteggi={conteggi} />
    </div>
  );
}
