import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { consegnaStato, registrazioneDaVerificare, CATEGORIA_DICHIARAZIONE_CONFORMITA } from "@/lib/laboratori";
import { LaboratoriAlertBox } from "@/components/app/laboratori-alert-box";
import { LaboratoriTabs } from "@/components/app/laboratori-tabs";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function LaboratoriLayout({ children }: { children: React.ReactNode }) {
  const { studio } = await requireActiveSubscription("laboratori");

  const [lavorazioni, laboratori] = await Promise.all([
    prisma.lavorazione.findMany({
      where: { studioId: studio.id },
      include: { laboratorio: true, allegati: true },
    }),
    prisma.laboratorio.findMany({ where: { studioId: studio.id, stato: "ATTIVO" } }),
  ]);

  const consegneImminenti = lavorazioni
    .map((l) => ({ l, ...consegnaStato(l.dataConsegnaPrevista, l.dataConsegnaEffettiva) }))
    .filter((x): x is typeof x & { stato: "IN_SCADENZA" | "SCADUTO" } => x.stato !== "OK")
    .map((x) => ({
      id: x.l.id,
      riferimentoPaziente: x.l.riferimentoPaziente,
      laboratorio: x.l.laboratorio.ragioneSociale,
      giorni: x.giorni,
      stato: x.stato,
    }));

  const dichiarazioniMancanti = lavorazioni
    .filter(
      (l) =>
        (l.stato === "CONSEGNATO_STUDIO" || l.stato === "CONSEGNATO_PAZIENTE") &&
        !l.allegati.some((a) => a.categoria === CATEGORIA_DICHIARAZIONE_CONFORMITA)
    )
    .map((l) => ({ id: l.id, riferimentoPaziente: l.riferimentoPaziente, laboratorio: l.laboratorio.ragioneSociale }));

  const laboratoriDaVerificare = laboratori
    .filter((lab) => registrazioneDaVerificare(lab.dataUltimaVerificaRegistrazione))
    .map((lab) => ({ id: lab.id, ragioneSociale: lab.ragioneSociale }));

  return (
    <div className="space-y-6">
      <LaboratoriAlertBox
        consegneImminenti={consegneImminenti}
        dichiarazioniMancanti={dichiarazioniMancanti}
        laboratoriDaVerificare={laboratoriDaVerificare}
      />
      <LaboratoriTabs />
      {children}
    </div>
  );
}
