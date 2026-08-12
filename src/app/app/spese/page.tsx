import Link from "next/link";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { formatDate, formatCurrency } from "@/lib/compliance";
import {
  CATEGORIA_SPESA_OPTIONS,
  optionLabel,
  totaleSpese,
  sommaPerCategoria,
  speseEffettiveDelMese,
  speseDellAnno,
  ricorrenzaLabel,
  costoAnnualizzato,
  costoAnnuoProiettato,
} from "@/lib/spese";
import { eliminaSpesa } from "@/lib/actions/spese";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { DeleteButton } from "@/components/ui/delete-button";
import { StatusDonut } from "@/components/charts/donut";
import { BRAND_SEQUENTIAL } from "@/components/charts/colors";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function SpesePage() {
  const { studio } = await requireActiveSubscription("spese");

  const spese = await prisma.spesaStudio.findMany({ where: { studioId: studio.id }, orderBy: { data: "desc" } });

  const oggi = new Date();
  const anno = oggi.getUTCFullYear();
  const mese = oggi.getUTCMonth();

  const delMese = speseEffettiveDelMese(spese, anno, mese);
  const dellAnno = speseDellAnno(spese, anno);
  const ripartizioneMese = sommaPerCategoria(delMese).map((s, i) => ({
    label: optionLabel(CATEGORIA_SPESA_OPTIONS, s.categoria),
    value: s.importo,
    color: BRAND_SEQUENTIAL[i % BRAND_SEQUENTIAL.length],
  }));

  return (
    <div>
      <PageHeader
        title="Spese / Diario del titolare"
        description="Le tue voci di spesa (affitto, utenze, collaboratori...): finiscono nel riepilogo in dashboard, non sostituiscono la contabilità."
        action="Aggiungi spesa"
        actionHref="/app/spese/new"
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Spese questo mese" value={formatCurrency(totaleSpese(delMese))} />
        <StatCard label="Spese registrate quest'anno" value={formatCurrency(totaleSpese(dellAnno))} />
        <StatCard label="Costo annuo stimato" value={formatCurrency(costoAnnuoProiettato(spese, anno))} />
        <StatCard label="Voci registrate" value={spese.length} />
      </div>
      <p className="mb-6 -mt-3 text-xs text-slate-400">
        Il &laquo;costo annuo stimato&raquo; proietta le spese ricorrenti sull&apos;intero anno in base alla loro
        cadenza (es. 100€ ogni 2 mesi = 600€/anno) e somma le spese una tantum dell&apos;anno.
      </p>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Ripartizione per categoria — questo mese</h2>
        {ripartizioneMese.length > 0 ? (
          <StatusDonut segments={ripartizioneMese} formatValue={formatCurrency} />
        ) : (
          <p className="text-sm text-slate-500">Nessuna spesa registrata questo mese.</p>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Descrizione</th>
              <th className="px-4 py-3">Importo</th>
              <th className="px-4 py-3">Ricorrenza</th>
              <th className="px-4 py-3">Costo annuo</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {spese.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-600">{formatDate(s.data)}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{optionLabel(CATEGORIA_SPESA_OPTIONS, s.categoria)}</td>
                <td className="px-4 py-3 max-w-xs truncate text-slate-500">{s.descrizione ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{formatCurrency(s.importo)}</td>
                <td className="px-4 py-3 text-slate-500">{ricorrenzaLabel(s.ricorrenzaMesi)}</td>
                <td className="px-4 py-3 text-slate-500">
                  {s.ricorrenzaMesi ? formatCurrency(costoAnnualizzato(s.importo, s.ricorrenzaMesi)) : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/app/spese/${s.id}/edit`} className="text-sm font-medium text-brand-600 hover:text-brand-800">
                      Modifica
                    </Link>
                    <DeleteButton action={eliminaSpesa.bind(null, s.id)} />
                  </div>
                </td>
              </tr>
            ))}
            {spese.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Nessuna spesa registrata finora.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
