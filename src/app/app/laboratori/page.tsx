import Link from "next/link";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/compliance";
import { optionLabel, parseTipologie, calcolaIndicatoriLaboratorio, STATO_LABORATORIO_OPTIONS, TIPOLOGIA_LAVORAZIONE_OPTIONS, CATEGORIA_DICHIARAZIONE_CONFORMITA } from "@/lib/laboratori";
import { PageHeader } from "@/components/ui/page-header";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function LaboratoriPage() {
  const { studio } = await requireActiveSubscription("laboratori");

  const laboratori = await prisma.laboratorio.findMany({
    where: { studioId: studio.id },
    include: { lavorazioni: { include: { allegati: true } } },
    orderBy: [{ stato: "asc" }, { ragioneSociale: "asc" }],
  });

  return (
    <div>
      <PageHeader
        title="Laboratori"
        description="Anagrafica dei laboratori odontotecnici e tracciabilità delle dichiarazioni di conformità (Reg. UE 2017/745, Allegato XIII)."
        action="Nuovo laboratorio"
        actionHref="/app/laboratori/new"
      />
      <p className="mb-6 max-w-3xl text-sm text-slate-500">
        Il laboratorio non è un utente di questa app: tutti i dati e i documenti li carichi tu. Lo studio, come
        prescrittore, ha l&apos;obbligo di conservare la dichiarazione di conformità di ogni dispositivo su misura
        e di consegnarne copia al paziente.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {laboratori.map((lab) => {
          const indicatori = calcolaIndicatoriLaboratorio(
            lab.lavorazioni.map((l) => ({
              dataInvio: l.dataInvio,
              dataConsegnaPrevista: l.dataConsegnaPrevista,
              dataConsegnaEffettiva: l.dataConsegnaEffettiva,
              stato: l.stato,
              costo: l.costo,
              hasDichiarazione: l.allegati.some((a) => a.categoria === CATEGORIA_DICHIARAZIONE_CONFORMITA),
            }))
          );
          const tipologie = parseTipologie(lab.tipologieLavorazione);

          return (
            <Link
              key={lab.id}
              href={`/app/laboratori/${lab.id}`}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-brand-300"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <h2 className="font-semibold text-slate-900">{lab.ragioneSociale}</h2>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    lab.stato === "ATTIVO" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {optionLabel(STATO_LABORATORIO_OPTIONS, lab.stato)}
                </span>
              </div>
              {tipologie.length > 0 && (
                <p className="mb-3 text-xs text-slate-500">
                  {tipologie.map((t) => optionLabel(TIPOLOGIA_LAVORAZIONE_OPTIONS, t)).join(" · ")}
                </p>
              )}
              <div className="mb-3">
                {indicatori.lavoriInCorso > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                    {indicatori.lavoriInCorso} lavor{indicatori.lavoriInCorso === 1 ? "azione" : "azioni"} in corso
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                    Nessun lavoro in corso
                  </span>
                )}
              </div>
              <dl className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Lavori nell&apos;anno</dt>
                  <dd className="font-medium text-slate-900">{indicatori.lavoriAnno}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Spesa nell&apos;anno</dt>
                  <dd className="font-medium text-slate-900">{formatCurrency(indicatori.spesaAnno)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Consegne puntuali</dt>
                  <dd className="font-medium text-slate-900">
                    {indicatori.percentualeConsegnePuntuali === null ? "—" : `${indicatori.percentualeConsegnePuntuali}%`}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Con dichiarazione</dt>
                  <dd className={`font-medium ${indicatori.percentualeDichiarazioni !== null && indicatori.percentualeDichiarazioni < 100 ? "text-red-600" : "text-slate-900"}`}>
                    {indicatori.percentualeDichiarazioni === null ? "—" : `${indicatori.percentualeDichiarazioni}%`}
                  </dd>
                </div>
              </dl>
            </Link>
          );
        })}
      </div>

      {laboratori.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center shadow-sm">
          <p className="text-sm text-slate-500">Non hai ancora censito nessun laboratorio odontotecnico.</p>
          <Link
            href="/app/laboratori/new"
            className="mt-3 inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
          >
            Aggiungi il primo laboratorio
          </Link>
        </div>
      )}
    </div>
  );
}
