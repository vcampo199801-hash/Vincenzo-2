import Link from "next/link";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/compliance";
import {
  tassoConversionePreventivi,
  reportPerPersona,
  preventivoScadenzaStato,
  optionLabelKpi,
  STATO_PREVENTIVO_OPTIONS,
  MODALITA_PAGAMENTO_OPTIONS,
} from "@/lib/kpi";
import { deletePreventivo } from "@/lib/actions/kpi";
import { KpiTabs } from "@/components/app/kpi-tabs";
import { PreventiviFiltroPersona } from "@/components/app/preventivi-filtro-persona";
import { PageHeader } from "@/components/ui/page-header";
import { DeleteButton } from "@/components/ui/delete-button";
import { TableScroll } from "@/components/ui/table-scroll";
import { StatoBadge } from "@/components/ui/badge";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

type SearchParams = { dottore?: string; commerciale?: string; stato?: string; vista?: string };

function chipHref(base: SearchParams, chiave: keyof SearchParams, valore: string) {
  const next: SearchParams = { ...base };
  if (next[chiave] === valore) {
    delete next[chiave];
  } else {
    next[chiave] = valore;
  }
  const qs = new URLSearchParams(next as Record<string, string>).toString();
  return `/app/kpi/preventivi${qs ? `?${qs}` : ""}`;
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium ${
        active ? "bg-brand-600 text-white" : "border border-slate-300 text-slate-700 hover:bg-slate-50"
      }`}
    >
      {children}
    </Link>
  );
}

export default async function PreventiviPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { studio } = await requireActiveSubscription("kpi");
  const params = await searchParams;

  const tutti = await prisma.preventivo.findMany({ where: { studioId: studio.id }, orderBy: { data: "desc" } });

  const dottori = [...new Set(tutti.map((p) => p.dottore))].sort();
  const commerciali = [...new Set(tutti.map((p) => p.commerciale).filter((c): c is string => Boolean(c)))].sort();

  const filtrati = tutti.filter(
    (p) =>
      (!params.dottore || p.dottore === params.dottore) &&
      (!params.commerciale || p.commerciale === params.commerciale) &&
      (!params.stato || p.stato === params.stato)
  );

  const vista: "dottore" | "commerciale" = params.vista === "commerciale" ? "commerciale" : "dottore";
  const report = reportPerPersona(filtrati, vista);

  const totaleProposto = filtrati.reduce((s, p) => s + p.totaleProposto, 0);
  const totaleAccettato = filtrati.reduce((s, p) => s + (p.totaleAccettato ?? 0), 0);
  const conversione = tassoConversionePreventivi(totaleProposto, totaleAccettato);

  return (
    <div>
      <PageHeader
        title="Preventivi"
        description="Ogni preventivo presentato, con dottore, commerciale, importo e stato — per estrarre report per persona."
        action="+ Nuovo preventivo"
        actionHref="/app/kpi/preventivi/new"
      />

      <KpiTabs />

      <div className="mb-6 flex flex-wrap gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">Dottore</p>
          <PreventiviFiltroPersona
            paramName="dottore"
            valoreAttuale={params.dottore ?? ""}
            opzioni={dottori}
            placeholder="Tutti i dottori"
            currentParams={params}
          />
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">Commerciale</p>
          <PreventiviFiltroPersona
            paramName="commerciale"
            valoreAttuale={params.commerciale ?? ""}
            opzioni={commerciali}
            placeholder="Tutti i commerciali"
            currentParams={params}
          />
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">Stato</p>
          <div className="flex flex-wrap gap-1.5">
            {STATO_PREVENTIVO_OPTIONS.map((s) => (
              <Chip key={s.value} href={chipHref(params, "stato", s.value)} active={params.stato === s.value}>
                {s.label}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-500">Totale proposto</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(totaleProposto)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-500">Totale accettato</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(totaleAccettato)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-500">Tasso di conversione</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{conversione === null ? "—" : `${conversione}%`}</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900">Report per persona</h2>
          <div className="flex gap-1.5">
            <Chip href={chipHref(params, "vista", "dottore")} active={vista === "dottore"}>
              Per dottore
            </Chip>
            <Chip href={chipHref(params, "vista", "commerciale")} active={vista === "commerciale"}>
              Per commerciale
            </Chip>
          </div>
        </div>
        <TableScroll>
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">{vista === "dottore" ? "Dottore" : "Commerciale"}</th>
                <th className="px-3 py-2">N. preventivi</th>
                <th className="px-3 py-2">Proposto</th>
                <th className="px-3 py-2">Accettato</th>
                <th className="px-3 py-2">Conversione</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report.map((r) => (
                <tr key={r.nome}>
                  <td className="px-3 py-2 font-medium text-slate-900">{r.nome}</td>
                  <td className="px-3 py-2 text-slate-600">{r.numeroPreventivi}</td>
                  <td className="px-3 py-2 text-slate-600">{formatCurrency(r.totaleProposto)}</td>
                  <td className="px-3 py-2 text-slate-600">{formatCurrency(r.totaleAccettato)}</td>
                  <td className="px-3 py-2 text-slate-600">{r.tassoConversione === null ? "—" : `${r.tassoConversione}%`}</td>
                </tr>
              ))}
              {report.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                    Nessun preventivo per questo filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </TableScroll>
      </div>

      <TableScroll className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Dottore</th>
              <th className="px-4 py-3">Commerciale</th>
              <th className="px-4 py-3">Proposto</th>
              <th className="px-4 py-3">Accettato</th>
              <th className="px-4 py-3">Scadenza</th>
              <th className="px-4 py-3">Assicurazione</th>
              <th className="px-4 py-3">Pagamento</th>
              <th className="px-4 py-3">Stato</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtrati.map((p) => {
              const scadenzaStato = preventivoScadenzaStato(p.scadenza, p.stato);
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{formatDate(p.data)}</td>
                  <td className="px-4 py-3 text-slate-600">{p.dottore}</td>
                  <td className="px-4 py-3 text-slate-600">{p.commerciale ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(p.totaleProposto)}</td>
                  <td className="px-4 py-3 text-slate-600">{p.totaleAccettato === null ? "—" : formatCurrency(p.totaleAccettato)}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {p.scadenza ? formatDate(p.scadenza) : "—"}
                    {scadenzaStato !== "OK" && <span className="ml-1.5"><StatoBadge stato={scadenzaStato} /></span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.assicurazione ?? "Nessuna"}</td>
                  <td className="px-4 py-3 text-slate-600">{optionLabelKpi(MODALITA_PAGAMENTO_OPTIONS, p.modalitaPagamento)}</td>
                  <td className="px-4 py-3">
                    <StatoBadge stato={p.stato} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/app/kpi/preventivi/${p.id}/edit`} className="text-sm font-medium text-brand-600 hover:text-brand-800">
                        Modifica
                      </Link>
                      <DeleteButton action={deletePreventivo.bind(null, p.id)} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtrati.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                  Nessun preventivo inserito finora.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableScroll>
    </div>
  );
}
