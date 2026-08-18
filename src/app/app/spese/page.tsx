import Link from "next/link";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { formatDate, formatCurrency } from "@/lib/compliance";
import { inizioAnno, inizioMese, mesiTraDate, toIsoDate } from "@/lib/kpi";
import {
  CATEGORIA_SPESA_OPTIONS,
  optionLabel,
  totaleSpese,
  sommaPerCategoria,
  speseEffettiveDelMese,
  speseEffettiveNelPeriodo,
  speseDellAnno,
  ricorrenzaLabel,
  costoAnnuoRiga,
  costoAnnuoProiettato,
  costoAnnuoProiettatoPerCategoria,
} from "@/lib/spese";
import { eliminaSpesa } from "@/lib/actions/spese";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { DeleteButton } from "@/components/ui/delete-button";
import { TableScroll } from "@/components/ui/table-scroll";
import { StatusDonut } from "@/components/charts/donut";
import { BRAND_SEQUENTIAL } from "@/components/charts/colors";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

const PERIODI_RIPARTIZIONE = [
  { value: "mensile", label: "Mensile" },
  { value: "annuale", label: "Annuale" },
  { value: "personalizzato", label: "Personalizzato" },
] as const;
type PeriodoRipartizione = (typeof PERIODI_RIPARTIZIONE)[number]["value"];

export default async function SpesePage({
  searchParams,
}: {
  searchParams: Promise<{ ripartizione?: string; ripartizioneDa?: string; ripartizioneA?: string }>;
}) {
  const { studio } = await requireActiveSubscription("spese");
  const params = await searchParams;

  const spese = await prisma.spesaStudio.findMany({ where: { studioId: studio.id }, orderBy: { data: "desc" } });

  const oggi = new Date();
  const anno = oggi.getUTCFullYear();
  const mese = oggi.getUTCMonth();

  const delMese = speseEffettiveDelMese(spese, anno, mese);
  const dellAnno = speseDellAnno(spese, anno);

  const periodoRipartizione: PeriodoRipartizione = PERIODI_RIPARTIZIONE.some((p) => p.value === params.ripartizione)
    ? (params.ripartizione as PeriodoRipartizione)
    : "mensile";
  const ripartizioneDaDefault = toIsoDate(inizioAnno(anno));
  const ripartizioneADefault = toIsoDate(oggi);
  const ripartizioneDaIso = params.ripartizioneDa || ripartizioneDaDefault;
  const ripartizioneAIso = params.ripartizioneA || ripartizioneADefault;

  let sommaCategorie: { categoria: string; importo: number }[];
  let titoloRipartizione: string;
  if (periodoRipartizione === "annuale") {
    // Stessa proiezione "a regime" del riquadro "Costo annuo stimato" sopra
    // (una ricorrente vale il suo importo annualizzato, non solo le
    // occorrenze già passate dall'inizio dell'anno), così i due numeri
    // coincidono sempre.
    sommaCategorie = costoAnnuoProiettatoPerCategoria(spese, anno);
    titoloRipartizione = `anno ${anno}`;
  } else if (periodoRipartizione === "personalizzato") {
    const dataInizio = new Date(ripartizioneDaIso);
    const dataFine = new Date(ripartizioneAIso);
    sommaCategorie = sommaPerCategoria(speseEffettiveNelPeriodo(spese, mesiTraDate(dataInizio, dataFine)));
    titoloRipartizione = `dal ${formatDate(dataInizio)} al ${formatDate(dataFine)}`;
  } else {
    sommaCategorie = sommaPerCategoria(speseEffettiveDelMese(spese, anno, mese));
    titoloRipartizione = `mese di ${new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric", timeZone: "UTC" }).format(inizioMese(anno, mese))}`;
  }
  const ripartizionePeriodo = sommaCategorie.map((s, i) => ({
    label: optionLabel(CATEGORIA_SPESA_OPTIONS, s.categoria),
    value: s.importo,
    color: BRAND_SEQUENTIAL[i % BRAND_SEQUENTIAL.length],
  }));

  return (
    <div>
      <PageHeader
        title="Spese / Diario del titolare"
        description="Le tue voci di spesa (affitto, utenze, collaboratori, ma anche rate di finanziamenti e leasing...): finiscono nel riepilogo in dashboard, non sostituiscono la contabilità."
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
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Ripartizione per categoria — {titoloRipartizione}</h2>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {PERIODI_RIPARTIZIONE.map((p) => (
            <Link
              key={p.value}
              href={`/app/spese?ripartizione=${p.value}`}
              className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium ${
                periodoRipartizione === p.value ? "bg-brand-600 text-white" : "border border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {p.label}
            </Link>
          ))}
          {periodoRipartizione === "personalizzato" && (
            <form method="get" className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="ripartizione" value="personalizzato" />
              <input
                type="date"
                name="ripartizioneDa"
                defaultValue={ripartizioneDaIso}
                className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
              />
              <span className="text-sm text-slate-400">—</span>
              <input
                type="date"
                name="ripartizioneA"
                defaultValue={ripartizioneAIso}
                className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
              />
              <button type="submit" className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200">
                Applica
              </button>
            </form>
          )}
        </div>

        {ripartizionePeriodo.length > 0 ? (
          <StatusDonut segments={ripartizionePeriodo} formatValue={formatCurrency} />
        ) : (
          <p className="text-sm text-slate-500">Nessuna spesa registrata in questo periodo.</p>
        )}
      </div>

      <TableScroll className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Descrizione</th>
              <th className="px-4 py-3">Importo</th>
              <th className="px-4 py-3">Ricorrenza</th>
              <th className="px-4 py-3">Scadenza</th>
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
                <td className="px-4 py-3 text-slate-500">{s.dataFineRicorrenza ? formatDate(s.dataFineRicorrenza) : "—"}</td>
                <td className="px-4 py-3 text-slate-500">
                  {costoAnnuoRiga(s, anno) > 0 ? formatCurrency(costoAnnuoRiga(s, anno)) : "—"}
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
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  Nessuna spesa registrata finora.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableScroll>
    </div>
  );
}
