import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { CATEGORIA_DICHIARAZIONE_CONFORMITA, isLavorazioneInCorso } from "@/lib/laboratori";
import { PageHeader } from "@/components/ui/page-header";
import { LavorazioniTable, type LavorazioneRow } from "@/components/app/lavorazioni-table";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function LavorazioniPage() {
  const { studio } = await requireActiveSubscription("laboratori");

  const [lavorazioni, laboratori] = await Promise.all([
    prisma.lavorazione.findMany({
      where: { studioId: studio.id },
      include: { laboratorio: true, allegati: true },
      orderBy: { dataInvio: "desc" },
    }),
    prisma.laboratorio.findMany({ where: { studioId: studio.id }, orderBy: { ragioneSociale: "asc" } }),
  ]);

  const rows: LavorazioneRow[] = lavorazioni.map((l) => ({
    id: l.id,
    laboratorioId: l.laboratorioId,
    laboratorioNome: l.laboratorio.ragioneSociale,
    riferimentoPaziente: l.riferimentoPaziente,
    tipoLavorazione: l.tipoLavorazione,
    dataInvio: l.dataInvio,
    dataConsegnaPrevista: l.dataConsegnaPrevista,
    dataConsegnaEffettiva: l.dataConsegnaEffettiva,
    stato: l.stato,
    costo: l.costo,
    dataConsegnaCopiaPaziente: l.dataConsegnaCopiaPaziente,
    hasDichiarazione: l.allegati.some((a) => a.categoria === CATEGORIA_DICHIARAZIONE_CONFORMITA),
  }));

  const inCorso = rows.filter((r) => isLavorazioneInCorso(r.stato)).length;
  const consegnate = rows.length - inCorso;

  return (
    <div>
      <PageHeader
        title="Registro lavorazioni"
        description="Ordina, filtra e modifica direttamente in tabella: le modifiche si salvano da sole."
        action="Nuova lavorazione"
        actionHref="/app/laboratori/lavorazioni/new"
      />
      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 font-medium text-brand-700">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> {inCorso} in corso presso il laboratorio
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {consegnate} consegnate
        </span>
      </div>
      <LavorazioniTable lavorazioni={rows} laboratori={laboratori.map((l) => ({ id: l.id, ragioneSociale: l.ragioneSociale }))} />
    </div>
  );
}
