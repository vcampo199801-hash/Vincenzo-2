import Link from "next/link";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { lottoStato, formatDate, daysUntil, MESI_LABELS } from "@/lib/compliance";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatoBadge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/ui/delete-button";
import { deleteFarmaco, ensureControlliAnno } from "@/lib/actions/farmaci";
import { MonthlyControlRow } from "@/components/app/monthly-control-row";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function FarmaciPage() {
  const { studio } = await requireActiveSubscription();
  const anno = new Date().getFullYear();

  await ensureControlliAnno(anno);

  const [farmaci, controlliMensili] = await Promise.all([
    prisma.farmaco.findMany({ where: { studioId: studio.id }, orderBy: { nome: "asc" } }),
    prisma.farmacoControlloMensile.findMany({ where: { studioId: studio.id, anno }, orderBy: { mese: "asc" } }),
  ]);

  const rows = farmaci.map((f) => ({ f, stato: lottoStato(f.scadenza, 90), giorni: daysUntil(f.scadenza) }));
  const scaduti = rows.filter((r) => r.stato === "SCADUTO").length;
  const inScadenza = rows.filter((r) => r.stato === "IN_SCADENZA").length;

  return (
    <div className="space-y-8">
      <div>
        <PageHeader
          title="Farmaci di emergenza e primo soccorso"
          description="Scadenze sotto controllo, con avviso 90 giorni prima."
          action="Aggiungi farmaco/presidio"
          actionHref="/app/farmaci/new"
        />

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Presidi censiti" value={farmaci.length} />
          <StatCard label="Scaduti" value={scaduti} tone={scaduti > 0 ? "bad" : "good"} />
          <StatCard label="In scadenza (90gg)" value={inScadenza} tone={inScadenza > 0 ? "warn" : "good"} />
          <StatCard label="OK" value={rows.length - scaduti - inScadenza} tone="good" />
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Farmaco / Presidio</th>
                <th className="px-4 py-3">Dove si trova</th>
                <th className="px-4 py-3">Quantità</th>
                <th className="px-4 py-3">Lotto</th>
                <th className="px-4 py-3">Scadenza</th>
                <th className="px-4 py-3">Giorni</th>
                <th className="px-4 py-3">Stato</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(({ f, stato, giorni }) => (
                <tr key={f.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{f.nome}</p>
                    {f.categoriaUso && <p className="text-xs text-slate-500">{f.categoriaUso}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{f.doveSiTrova ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{f.quantita}</td>
                  <td className="px-4 py-3 text-slate-600">{f.lotto ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(f.scadenza)}</td>
                  <td className="px-4 py-3 text-slate-600">{giorni ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatoBadge stato={stato} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/app/farmaci/${f.id}/edit`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                        Modifica
                      </Link>
                      <DeleteButton action={deleteFarmaco.bind(null, f.id)} />
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Nessun farmaco censito.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          Registro controlli mensili {anno}
        </h2>
        <p className="mb-3 text-sm text-slate-500">
          Controllo scadenze farmaci e integrità kit di primo soccorso, mese per mese.
        </p>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Mese</th>
                <th className="px-2 py-2">Data controllo</th>
                <th className="px-2 py-2">Operatore</th>
                <th className="px-2 py-2">Esito / Note</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {controlliMensili.map((c) => (
                <MonthlyControlRow
                  key={c.id}
                  id={c.id}
                  mese={MESI_LABELS[c.mese - 1]}
                  dataControllo={c.dataControllo?.toISOString().slice(0, 10) ?? ""}
                  operatore={c.operatore ?? ""}
                  esito={c.esito ?? ""}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
