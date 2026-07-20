import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { provisionStudioDefaults } from "../src/lib/seed-data";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@sorrisiinregola.it";
const DEMO_PASSWORD = "demo12345";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (existing) {
    console.log("Demo user già presente, nessuna azione.");
    return;
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const user = await prisma.user.create({
    data: {
      name: "Dott. Demo",
      email: DEMO_EMAIL,
      passwordHash,
      studios: {
        create: {
          name: "Studio Dentistico Demo",
          titolare: "Dott. Mario Demo",
          citta: "Milano",
          telefono: "02 1234567",
          email: DEMO_EMAIL,
          subscription: {
            create: { status: "TRIALING", trialEndsAt: daysFromNow(14) },
          },
        },
      },
    },
    include: { studios: true },
  });

  const studio = user.studios[0];
  await prisma.membership.create({ data: { studioId: studio.id, userId: user.id, role: "OWNER" } });
  await provisionStudioDefaults(studio.id);

  // Backfill a few of the standard adempimenti with example dates, mirroring the
  // original spreadsheet's sample rows (estintori, autoclave, messa a terra, sorveglianza).
  const adempimenti = await prisma.adempimento.findMany({ where: { studioId: studio.id }, orderBy: { ordine: "asc" } });
  const byName = (needle: string) => adempimenti.find((a) => a.nome.includes(needle));

  const estintori = byName("estintori");
  const autoclave = byName("Validazione annuale autoclave");
  const messaATerra = byName("messa a terra");
  const sorveglianza = byName("Sorveglianza sanitaria");

  if (estintori) await prisma.adempimento.update({ where: { id: estintori.id }, data: { dataUltimoControllo: daysAgo(71) } });
  if (autoclave) await prisma.adempimento.update({ where: { id: autoclave.id }, data: { dataUltimoControllo: daysAgo(349) } });
  if (messaATerra) await prisma.adempimento.update({ where: { id: messaATerra.id }, data: { dataUltimoControllo: daysAgo(858) } });
  if (sorveglianza) await prisma.adempimento.update({ where: { id: sorveglianza.id }, data: { dataUltimoControllo: daysAgo(181) } });

  if (estintori) {
    await prisma.controlloLog.create({
      data: {
        studioId: studio.id,
        adempimentoId: estintori.id,
        dataIntervento: daysAgo(71),
        tecnico: "Antincendio Rossi S.r.l.",
        esito: "Conforme",
        costo: 95,
        note: "Sostituito cartellino estintore n.2 — ESEMPIO",
      },
    });
  }
  if (autoclave) {
    await prisma.controlloLog.create({
      data: {
        studioId: studio.id,
        adempimentoId: autoclave.id,
        dataIntervento: daysAgo(349),
        tecnico: "TechSteril Service (esempio)",
        esito: "Conforme",
        costo: 180,
        note: "Rapporto di validazione archiviato — ESEMPIO",
      },
    });
  }

  await prisma.ecmCredito.createMany({
    data: [
      { studioId: studio.id, professionista: "Dott. Esempio (sostituiscimi)", crediti2026: 32, crediti2027: 0, crediti2028: 23, target: 150 },
      { studioId: studio.id, professionista: "Dott.ssa Esempio (sostituiscimi)", crediti2026: 48, crediti2027: 0, crediti2028: 0, target: 150 },
      { studioId: studio.id, professionista: "Igienista Esempio (sostituiscimi)", crediti2026: 10, crediti2027: 0, crediti2028: 22, target: 150 },
    ],
  });

  const documenti = await prisma.documento.findMany({ where: { studioId: studio.id }, orderBy: { ordine: "asc" } });
  if (documenti[0]) await prisma.documento.update({ where: { id: documenti[0].id }, data: { stato: "PRESENTE", note: "Armadio segreteria, faldone 1 — ESEMPIO" } });
  if (documenti[1]) await prisma.documento.update({ where: { id: documenti[1].id }, data: { stato: "PRESENTE" } });
  if (documenti[2]) await prisma.documento.update({ where: { id: documenti[2].id }, data: { stato: "DA_AGGIORNARE", note: "Da rivedere dopo nuova assunzione — ESEMPIO" } });
  if (documenti[3]) await prisma.documento.update({ where: { id: documenti[3].id }, data: { stato: "MANCANTE", note: "Da richiedere al consulente — ESEMPIO" } });

  await prisma.magazzinoItem.createMany({
    data: [
      { studioId: studio.id, categoria: "Sterilizzazione / Disinfezione", prodotto: "Buste autosigillanti sterilizzazione 90x230", fornitore: "Depot Dentale Esempio S.r.l.", unita: "conf.", scortaMinima: 5, quantitaAttuale: 3, scadenzaLotto: daysFromNow(254), prezzoUnitario: 4.5, note: "ESEMPIO — scorta da riordinare" },
      { studioId: studio.id, categoria: "Monouso / DPI", prodotto: "Guanti nitrile taglia M", fornitore: "Depot Dentale Esempio S.r.l.", unita: "conf.", scortaMinima: 10, quantitaAttuale: 12, prezzoUnitario: 6.9, note: "ESEMPIO — scorta bassa" },
      { studioId: studio.id, categoria: "Anestetici", prodotto: "Articaina 4% con adrenalina 1:100.000", fornitore: "Depot Dentale Esempio S.r.l.", unita: "scatola", scortaMinima: 4, quantitaAttuale: 2, scadenzaLotto: daysFromNow(26), prezzoUnitario: 28, note: "ESEMPIO — lotto in scadenza" },
      { studioId: studio.id, categoria: "Conservativa / Adesivi", prodotto: "Composito nanoibrido A2 — siringa 4g", fornitore: "Depot Dentale Esempio S.r.l.", unita: "pz", scortaMinima: 4, quantitaAttuale: 6, scadenzaLotto: daysAgo(49), prezzoUnitario: 32, note: "ESEMPIO — lotto SCADUTO da smaltire" },
      { studioId: studio.id, categoria: "Endodonzia", prodotto: "Coni di guttaperca ISO 25", fornitore: "Depot Dentale Esempio S.r.l.", unita: "conf.", scortaMinima: 2, quantitaAttuale: 5, scadenzaLotto: daysFromNow(890), prezzoUnitario: 9.5, note: "ESEMPIO — tutto in ordine" },
    ],
  });

  await prisma.farmaco.createMany({
    data: [
      { studioId: studio.id, nome: "Adrenalina 1 mg/ml — fiale", categoriaUso: "Emergenza allergica", doveSiTrova: "Carrello emergenza", quantita: 3, lotto: "LOTTO-ES1", scadenza: daysFromNow(41), note: "ESEMPIO — in scadenza: riordina" },
      { studioId: studio.id, nome: "Salbutamolo spray 100 mcg", categoriaUso: "Emergenza respiratoria", doveSiTrova: "Carrello emergenza", quantita: 1, lotto: "LOTTO-ES2", scadenza: daysFromNow(315), note: "ESEMPIO" },
      { studioId: studio.id, nome: "Antistaminico fiale (clorfenamina)", categoriaUso: "Emergenza allergica", doveSiTrova: "Carrello emergenza", quantita: 1, lotto: "LOTTO-ES3", scadenza: daysAgo(20), note: "ESEMPIO — SCADUTO: smaltire e sostituire" },
      { studioId: studio.id, nome: "Cortisonico fiale (metilprednisolone)", categoriaUso: "Emergenza allergica", doveSiTrova: "Carrello emergenza", quantita: 2, lotto: "LOTTO-ES4", scadenza: daysFromNow(468), note: "ESEMPIO" },
      { studioId: studio.id, nome: "Nitroglicerina sublinguale", categoriaUso: "Emergenza cardiovascolare", doveSiTrova: "Carrello emergenza", quantita: 1, lotto: "LOTTO-ES5", scadenza: daysFromNow(57), note: "ESEMPIO — in scadenza" },
      { studioId: studio.id, nome: "Acido acetilsalicilico 300 mg", categoriaUso: "Emergenza cardiovascolare", doveSiTrova: "Carrello emergenza", quantita: 1, lotto: "LOTTO-ES6", scadenza: daysFromNow(560), note: "ESEMPIO" },
      { studioId: studio.id, nome: "Glucosio / zollette di zucchero", categoriaUso: "Ipoglicemia", doveSiTrova: "Cassetto reception", quantita: 1, lotto: "—", scadenza: daysFromNow(254), note: "ESEMPIO" },
      { studioId: studio.id, nome: "Soluzione fisiologica 500 ml", categoriaUso: "Primo soccorso", doveSiTrova: "Armadio primo soccorso", quantita: 2, lotto: "LOTTO-ES7", scadenza: daysFromNow(407), note: "ESEMPIO" },
      { studioId: studio.id, nome: "Kit primo soccorso (contenuto DM 388/03)", categoriaUso: "Primo soccorso", doveSiTrova: "Sala sterilizzazione", quantita: 1, lotto: "—", scadenza: daysFromNow(223), note: "ESEMPIO — verifica integrità contenuto" },
    ],
  });

  const fornitori = await prisma.fornitore.findMany({ where: { studioId: studio.id, tipo: "COMPLIANCE" }, orderBy: { ruolo: "asc" } });
  const antincendio = fornitori.find((f) => f.ruolo.includes("antincendio"));
  if (antincendio) {
    await prisma.fornitore.update({
      where: { id: antincendio.id },
      data: {
        nome: "Antincendio Rossi S.r.l. (esempio)",
        telefono: "02 1234567",
        email: "info@antincendiorossi.it",
        contrattoAttivo: true,
        scadenzaContratto: daysFromNow(195),
        note: "Contratto semestrale controllo estintori — ESEMPIO",
      },
    });
  }

  await prisma.fornitore.create({
    data: {
      studioId: studio.id,
      tipo: "MATERIALI",
      ruolo: "Deposito dentale",
      nome: "Depot Dentale Esempio S.r.l.",
      note: "Riga di ESEMPIO — sostituiscimi",
    },
  });

  console.log(`Demo pronta: login con ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
