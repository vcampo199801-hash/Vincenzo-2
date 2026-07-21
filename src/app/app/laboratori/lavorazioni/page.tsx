import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { CATEGORIA_DICHIARAZIONE_CONFORMITA } from "@/lib/laboratori";
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

  return (
    <div>
      <PageHeader
        title="Registro lavorazioni"
        description="Ordina, filtra e modifica direttamente in tabella: le modifiche si salvano da sole."
        action="Nuova lavorazione"
        actionHref="/app/laboratori/lavorazioni/new"
      />
      <LavorazioniTable lavorazioni={rows} laboratori={laboratori.map((l) => ({ id: l.id, ragioneSociale: l.ragioneSociale }))} />
    </div>
  );
}
