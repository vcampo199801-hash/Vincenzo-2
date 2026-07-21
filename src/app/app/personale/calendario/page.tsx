import { requirePersonaleAccess } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { logPersonaleAccess } from "@/lib/personale-access-log";
import { optionLabel, TIPO_ASSENZA_OPTIONS } from "@/lib/personale";
import { MESI_LABELS } from "@/lib/compliance";
import { PageHeader } from "@/components/ui/page-header";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

const TIPO_COLORS: Record<string, string> = {
  FERIE: "bg-emerald-500",
  ROL: "bg-brand-500",
  PERMESSO: "bg-sky-500",
  MALATTIA: "bg-amber-400",
  INFORTUNIO: "bg-red-600",
  MATERNITA: "bg-fuchsia-500",
  CONGEDO: "bg-violet-500",
  ASPETTATIVA: "bg-slate-400",
};

export default async function CalendarioAssenzePage({ searchParams }: { searchParams: Promise<{ anno?: string }> }) {
  const { studio, session } = await requirePersonaleAccess();
  const { anno: annoParam } = await searchParams;
  const anno = Number(annoParam) || new Date().getFullYear();

  const [dipendenti, movimenti] = await Promise.all([
    prisma.dipendente.findMany({ where: { studioId: studio.id, stato: "ATTIVO" }, orderBy: [{ cognome: "asc" }, { nome: "asc" }] }),
    prisma.movimentoAssenza.findMany({
      where: {
        studioId: studio.id,
        dataInizio: { gte: new Date(anno, 0, 1), lt: new Date(anno + 1, 0, 1) },
      },
    }),
  ]);

  await logPersonaleAccess({ studioId: studio.id, userId: session.userId, azione: "VIEW_LISTA" });

  const perDipendenteMese = new Map<string, Map<number, typeof movimenti>>();
  for (const d of dipendenti) perDipendenteMese.set(d.id, new Map());
  for (const m of movimenti) {
    const mese = m.dataInizio.getMonth();
    const perMese = perDipendenteMese.get(m.dipendenteId);
    if (!perMese) continue;
    if (!perMese.has(mese)) perMese.set(mese, []);
    perMese.get(mese)!.push(m);
  }

  return (
    <div>
      <PageHeader
        title="Calendario assenze"
        description="Vista annuale per pianificare le ferie e capire la copertura dello studio."
      />

      <div className="mb-4 flex items-center gap-2 text-sm">
        <span className="text-slate-500">Anno:</span>
        {[anno - 1, anno, anno + 1].map((y) => (
          <a
            key={y}
            href={`/app/personale/calendario?anno=${y}`}
            className={`rounded-lg px-3 py-1.5 font-medium ${y === anno ? "bg-brand-600 text-white" : "border border-slate-200 text-slate-700 hover:bg-slate-50"}`}
          >
            {y}
          </a>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-3 text-xs text-slate-600">
        {TIPO_ASSENZA_OPTIONS.map((t) => (
          <span key={t.value} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${TIPO_COLORS[t.value]}`} />
            {t.label}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="sticky left-0 bg-slate-50 px-4 py-3">Dipendente</th>
              {MESI_LABELS.map((m) => (
                <th key={m} className="px-3 py-3 text-center">
                  {m.slice(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dipendenti.map((d) => {
              const perMese = perDipendenteMese.get(d.id) ?? new Map<number, typeof movimenti>();
              return (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="sticky left-0 bg-white px-4 py-3 font-medium text-slate-900 hover:bg-slate-50">
                    {d.nome} {d.cognome}
                  </td>
                  {MESI_LABELS.map((_, meseIdx) => {
                    const eventi = perMese.get(meseIdx) ?? [];
                    return (
                      <td key={meseIdx} className="px-3 py-3 text-center">
                        {eventi.length > 0 ? (
                          <div className="flex flex-wrap items-center justify-center gap-1" title={eventi.map((e) => `${optionLabel(TIPO_ASSENZA_OPTIONS, e.tipo)}${e.giorni ? ` (${e.giorni}gg)` : ""}`).join(", ")}>
                            {eventi.map((e) => (
                              <span key={e.id} className={`h-2.5 w-2.5 rounded-full ${TIPO_COLORS[e.tipo] ?? "bg-slate-400"}`} />
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {dipendenti.length === 0 && (
              <tr>
                <td colSpan={13} className="px-4 py-8 text-center text-slate-500">
                  Nessun dipendente attivo censito.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
