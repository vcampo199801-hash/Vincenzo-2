import Link from "next/link";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { consegnaStato } from "@/lib/laboratori";
import { generaLinkCalendario } from "@/lib/actions/calendario";
import { PageHeader } from "@/components/ui/page-header";
import { TableScroll } from "@/components/ui/table-scroll";
import { CopyLinkButton } from "@/components/app/copy-link-button";
import { SubmitButton } from "@/components/ui/form";

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

const GIORNI_SETTIMANA = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const NOMI_MESE = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

type SearchParams = { anno?: string; mese?: string };

export default async function ScadenzeLaboratoriPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { studio } = await requireActiveSubscription("laboratori");
  const params = await searchParams;

  const oggi = new Date();
  const anno = params.anno ? Number(params.anno) : oggi.getFullYear();
  const mese1based = params.mese ? Number(params.mese) : oggi.getMonth() + 1;
  const meseIndex = mese1based - 1; // 0-based, per i costruttori Date

  const primoGiorno = new Date(anno, meseIndex, 1);
  const ultimoGiorno = new Date(anno, meseIndex + 1, 0);

  const lavorazioni = await prisma.lavorazione.findMany({
    where: { studioId: studio.id, dataConsegnaEffettiva: null, dataConsegnaPrevista: { not: null } },
    include: { laboratorio: true },
    orderBy: { dataConsegnaPrevista: "asc" },
  });

  // Griglia: dal lunedì della settimana del giorno 1 alla domenica della settimana dell'ultimo giorno.
  const offsetInizio = (primoGiorno.getDay() + 6) % 7;
  const offsetFine = 6 - ((ultimoGiorno.getDay() + 6) % 7);
  const inizioGriglia = new Date(anno, meseIndex, 1 - offsetInizio);
  const fineGriglia = new Date(anno, meseIndex, ultimoGiorno.getDate() + offsetFine);

  const giorni: Date[] = [];
  for (const d = new Date(inizioGriglia); d <= fineGriglia; d.setDate(d.getDate() + 1)) {
    giorni.push(new Date(d));
  }

  const perGiorno = new Map<string, typeof lavorazioni>();
  for (const l of lavorazioni) {
    if (!l.dataConsegnaPrevista) continue;
    const key = l.dataConsegnaPrevista.toDateString();
    const arr = perGiorno.get(key) ?? [];
    arr.push(l);
    perGiorno.set(key, arr);
  }

  const mesePrec = mese1based === 1 ? { anno: anno - 1, mese: 12 } : { anno, mese: mese1based - 1 };
  const meseSucc = mese1based === 12 ? { anno: anno + 1, mese: 1 } : { anno, mese: mese1based + 1 };

  return (
    <div>
      <PageHeader
        title="Scadenze laboratori"
        description="Vista mensile delle consegne previste dai laboratori — un colpo d'occhio su cosa arriva quando."
      />

      <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <Link
          href={`/app/laboratori/scadenze?anno=${mesePrec.anno}&mese=${mesePrec.mese}`}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          ← {NOMI_MESE[mesePrec.mese - 1]}
        </Link>
        <h2 className="text-base font-semibold text-slate-900">
          {NOMI_MESE[meseIndex]} {anno}
        </h2>
        <Link
          href={`/app/laboratori/scadenze?anno=${meseSucc.anno}&mese=${meseSucc.mese}`}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          {NOMI_MESE[meseSucc.mese - 1]} →
        </Link>
      </div>

      <div className="mb-3 flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500" /> Scaduta
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" /> Entro 7 giorni
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-brand-500" /> Prevista
        </span>
      </div>

      <TableScroll className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-medium uppercase tracking-wide text-slate-500">
            {GIORNI_SETTIMANA.map((g) => (
              <div key={g} className="px-2 py-2">
                {g}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {giorni.map((giorno) => {
              const fuoriMese = giorno.getMonth() !== meseIndex;
              const eOggi = isSameDay(giorno, oggi);
              const eventi = (perGiorno.get(giorno.toDateString()) ?? []).map((l) => ({
                l,
                ...consegnaStato(l.dataConsegnaPrevista, l.dataConsegnaEffettiva),
              }));
              return (
                <div
                  key={giorno.toISOString()}
                  className={`min-h-[92px] border-b border-r border-slate-100 p-1.5 ${fuoriMese ? "bg-slate-50/60" : "bg-white"}`}
                >
                  <p
                    className={`mb-1 text-xs font-medium ${
                      eOggi
                        ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white"
                        : fuoriMese
                          ? "text-slate-300"
                          : "text-slate-500"
                    }`}
                  >
                    {giorno.getDate()}
                  </p>
                  <div className="space-y-1">
                    {eventi.slice(0, 3).map(({ l, stato }) => (
                      <Link
                        key={l.id}
                        href={`/app/laboratori/lavorazioni?evidenzia=${l.id}`}
                        title={`${l.riferimentoPaziente} · ${l.laboratorio.ragioneSociale}`}
                        className={`block truncate rounded px-1.5 py-0.5 text-[11px] font-medium ${
                          stato === "SCADUTO"
                            ? "bg-red-100 text-red-700"
                            : stato === "IN_SCADENZA"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-brand-100 text-brand-700"
                        }`}
                      >
                        {l.riferimentoPaziente}
                      </Link>
                    ))}
                    {eventi.length > 3 && <p className="px-1 text-[11px] text-slate-400">+{eventi.length - 3} altre</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </TableScroll>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Collega le scadenze a Google/Apple Calendar</h2>
        <p className="mt-1 text-sm text-slate-600">
          Una volta collegato, le consegne dei laboratori e le scadenze dello Scadenzario compaiono da sole nel tuo
          calendario abituale e si aggiornano in automatico — senza dover più aprire l&apos;app o riesportare nulla.
        </p>

        {studio.calendarioToken ? (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <input
                readOnly
                value={`${appUrl()}/api/calendario/feed/${studio.calendarioToken}`}
                className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600"
              />
              <CopyLinkButton
                url={`${appUrl()}/api/calendario/feed/${studio.calendarioToken}`}
                label="Copia collegamento"
              />
            </div>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600">
              <li>Copia il collegamento qui sopra.</li>
              <li>
                Su Google Calendar (computer): <strong>Aggiungi altri calendari → Da URL</strong> → incolla e conferma.
              </li>
              <li>
                Su iPhone/iPad: <strong>Impostazioni → App → Calendario → Account → Aggiungi account → Altro → Aggiungi
                calendario in abbonamento</strong> → incolla (sostituendo <code>https://</code> con <code>webcal://</code>).
              </li>
            </ol>
            <form action={generaLinkCalendario}>
              <button type="submit" className="text-sm font-medium text-slate-500 underline hover:text-slate-700">
                Rigenera collegamento (quello vecchio smette di funzionare)
              </button>
            </form>
          </div>
        ) : (
          <form action={generaLinkCalendario} className="mt-4">
            <SubmitButton>Genera il collegamento</SubmitButton>
          </form>
        )}
      </div>
    </div>
  );
}
