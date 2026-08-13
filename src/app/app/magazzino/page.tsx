import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { scortaStato, lottoStato, formatCurrency } from "@/lib/compliance";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { MagazzinoRow } from "@/components/app/magazzino-row";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function MagazzinoPage() {
  const { studio } = await requireActiveSubscription("magazzino");
  const items = await prisma.magazzinoItem.findMany({ where: { studioId: studio.id }, orderBy: { prodotto: "asc" } });

  const rows = items.map((i) => ({
    i,
    stato: scortaStato(i.scortaMinima, i.quantitaAttuale),
    lotto: lottoStato(i.scadenzaLotto),
    valore: i.quantitaAttuale * i.prezzoUnitario,
  }));

  const daRiordinare = rows.filter((r) => r.stato === "DA_RIORDINARE").length;
  const scortaBassa = rows.filter((r) => r.stato === "SCORTA_BASSA").length;
  const lottiCritici = rows.filter((r) => r.lotto === "SCADUTO" || r.lotto === "IN_SCADENZA").length;
  const valoreTotale = rows.reduce((sum, r) => sum + r.valore, 0);

  return (
    <div>
      <PageHeader
        title="Magazzino dello studio"
        description="Scorte, riordini e scadenze lotti sotto controllo."
        action="Aggiungi articolo"
        actionHref="/app/magazzino/new"
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Da riordinare" value={daRiordinare} tone={daRiordinare > 0 ? "bad" : "good"} />
        <StatCard label="Scorta bassa" value={scortaBassa} tone={scortaBassa > 0 ? "warn" : "good"} />
        <StatCard label="Lotti scaduti/in scadenza" value={lottiCritici} tone={lottiCritici > 0 ? "bad" : "good"} />
        <StatCard label="Valore giacenze" value={formatCurrency(valoreTotale)} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Prodotto</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Scorta attuale / min.</th>
              <th className="px-4 py-3">Stato scorta</th>
              <th className="px-4 py-3">Scadenza lotto</th>
              <th className="px-4 py-3">Stato lotto</th>
              <th className="px-4 py-3">Valore</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ i, lotto }) => (
              <MagazzinoRow
                key={i.id}
                id={i.id}
                prodotto={i.prodotto}
                fornitore={i.fornitore}
                categoria={i.categoria}
                quantitaAttuale={i.quantitaAttuale}
                scortaMinima={i.scortaMinima}
                unita={i.unita}
                prezzoUnitario={i.prezzoUnitario}
                scadenzaLotto={i.scadenzaLotto}
                lotto={lotto}
              />
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  Nessun articolo censito.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
