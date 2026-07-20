import { prisma } from "@/lib/prisma";

/** The 24 standard Italian dental-practice compliance obligations, taken from the
 * original "Scadenzario" spreadsheet template. */
export const ADEMPIMENTI_STANDARD: {
  nome: string;
  riferimento: string;
  periodicita: string;
  mesi: number;
}[] = [
  { nome: "Manutenzione e controllo estintori", riferimento: "D.M. 1 settembre 2021 — a cura di ditta abilitata", periodicita: "Semestrale", mesi: 6 },
  { nome: "Validazione annuale autoclave (Classe B)", riferimento: "UNI EN 13060 / UNI EN 17665 — rapporto di validazione del tecnico", periodicita: "Annuale", mesi: 12 },
  { nome: "Test biologico autoclave (spore test)", riferimento: "Periodicità secondo indicazioni regionali/protocollo interno (spesso mensile)", periodicita: "Mensile", mesi: 1 },
  { nome: "Verifica impianto di messa a terra — locali uso medico", riferimento: "DPR 462/01 — organismo abilitato o ASL/ARPA", periodicita: "Biennale", mesi: 24 },
  { nome: "Relazione annuale Esperto di Radioprotezione", riferimento: "D.Lgs. 101/2020 — se presenti apparecchi RX", periodicita: "Annuale", mesi: 12 },
  { nome: "Controlli di qualità apparecchi radiologici", riferimento: "D.Lgs. 101/2020 — a cura dell'Esperto/fisico incaricato", periodicita: "Annuale", mesi: 12 },
  { nome: "Sorveglianza sanitaria — visite medico competente", riferimento: "D.Lgs. 81/08 — periodicità stabilita dal medico competente", periodicita: "Annuale", mesi: 12 },
  { nome: "Aggiornamento formazione sicurezza lavoratori", riferimento: "Accordo Stato-Regioni — aggiornamento periodico", periodicita: "Quinquennale", mesi: 60 },
  { nome: "Aggiornamento formazione RLS (se nominato)", riferimento: "D.Lgs. 81/08 art. 37", periodicita: "Annuale", mesi: 12 },
  { nome: "Retraining BLSD del personale", riferimento: "Secondo ente certificatore (tipicamente 24 mesi)", periodicita: "Biennale", mesi: 24 },
  { nome: "Rinnovo polizza RC professionale", riferimento: "L. 24/2017 e D.M. 232/2023 — verifica massimali e continuità", periodicita: "Annuale", mesi: 12 },
  { nome: "Riesame e aggiornamento DVR", riferimento: "D.Lgs. 81/08 — obbligatorio a ogni variazione; riesame annuale consigliato", periodicita: "Annuale", mesi: 12 },
  { nome: "Manutenzione programmata riunito e apparecchiature", riferimento: "Secondo manuale del fabbricante (registrare gli interventi)", periodicita: "Annuale", mesi: 12 },
  { nome: "Riesame Registro dei Trattamenti e misure GDPR", riferimento: "Reg. UE 2016/679 — riesame periodico consigliato", periodicita: "Annuale", mesi: 12 },
  { nome: "Verifica adempimenti rifiuti sanitari (RENTRI)", riferimento: "Controllo registri, formulari e iscrizione RENTRI", periodicita: "Annuale", mesi: 12 },
  { nome: "Crediti ECM — verifica avanzamento triennio", riferimento: "Obiettivo crediti di fine triennio — verifica annuale consigliata", periodicita: "Annuale", mesi: 12 },
  { nome: "Verifica apparecchi elettromedicali", riferimento: "CEI EN 62353 — verifiche di sicurezza elettrica a cura di tecnico qualificato", periodicita: "Biennale", mesi: 24 },
  { nome: "Verifica interruttori differenziali", riferimento: "DPR 462/01 e norme CEI 64-8 — prova di intervento", periodicita: "Annuale", mesi: 12 },
  { nome: "Verifica nodi equipotenziali", riferimento: "CEI 64-8 sez. 710 (locali a uso medico)", periodicita: "Biennale", mesi: 24 },
  { nome: "Verifica e manutenzione caldaia", riferimento: "DPR 74/2013 e libretto d'impianto — a cura di manutentore abilitato", periodicita: "Annuale", mesi: 12 },
  { nome: "Verifica bombola ossigeno", riferimento: "Secondo fornitore e normativa attrezzature a pressione (D.Lgs. 93/2000)", periodicita: "Biennale", mesi: 24 },
  { nome: "Verifica impianto di climatizzazione", riferimento: "DPR 74/2013 — controllo efficienza e libretto d'impianto", periodicita: "Biennale", mesi: 24 },
  { nome: "Pulizia e sanificazione impianto climatizzazione", riferimento: "Accordo Stato-Regioni 05/10/2006 e D.Lgs. 81/08 — igiene impianti aeraulici", periodicita: "Semestrale", mesi: 6 },
  { nome: "Gestione rifiuti speciali — ritiro e registrazioni", riferimento: "DPR 254/2003 e RENTRI (D.M. 59/2023) — deposito temporaneo e ritiri periodici", periodicita: "Mensile", mesi: 1 },
];

export const DOCUMENTI_STANDARD: string[] = [
  "Documento di Valutazione dei Rischi (DVR)",
  "Registro dei Trattamenti (GDPR) e informative privacy",
  "Nomina del medico competente e protocollo sanitario",
  "Nomina RSPP (o autocertificazione svolgimento diretto)",
  "Incarico all'Esperto di Radioprotezione e relazioni",
  "Autorizzazione sanitaria / SCIA e planimetrie",
  "Piano di emergenza ed evacuazione",
  "Registro manutenzioni apparecchiature e riunito",
  "Documentazione produzione chairside (se lo studio produce in-house)",
  "Registro dei consensi informati",
  "Contratto smaltimento rifiuti sanitari + iscrizione RENTRI",
  "Dichiarazione di conformità impianto elettrico",
  "Verbali verifiche periodiche messa a terra (DPR 462/01)",
  "Attestati formazione sicurezza del personale",
  "Copia polizza RC professionale in corso di validità",
  "Certificati BLSD del personale",
];

export const FORNITORI_RUOLI_STANDARD: string[] = [
  "Ditta antincendio (estintori)",
  "Tecnico validazione autoclave",
  "Esperto di Radioprotezione",
  "Medico competente",
  "RSPP (se esterno)",
  "Organismo verifiche elettriche (DPR 462/01)",
  "Smaltimento rifiuti sanitari",
  "Assistenza riunito / apparecchiature",
  "Manutentore elettromedicali",
  "Manutentore impianto elettrico",
  "Manutentore impianto idraulico",
  "Manutentore caldaia / climatizzazione",
  "Antifurto / videosorveglianza",
  "Fornitore programma gestionale",
  "Consulente del lavoro",
  "Commercialista",
  "Broker / assicurazione RC",
  "Assistenza informatica e GDPR",
];

/** Provisions a freshly-signed-up studio with the standard checklists, mirroring
 * the pre-filled sheets of the original spreadsheet template. */
export async function provisionStudioDefaults(studioId: string) {
  const year = new Date().getFullYear();

  await prisma.$transaction([
    prisma.adempimento.createMany({
      data: ADEMPIMENTI_STANDARD.map((a, i) => ({
        studioId,
        ordine: i,
        nome: a.nome,
        riferimento: a.riferimento,
        periodicita: a.periodicita,
        mesi: a.mesi,
      })),
    }),
    prisma.documento.createMany({
      data: DOCUMENTI_STANDARD.map((nome, i) => ({
        studioId,
        ordine: i,
        nome,
        stato: "MANCANTE",
      })),
    }),
    prisma.fornitore.createMany({
      data: FORNITORI_RUOLI_STANDARD.map((ruolo) => ({
        studioId,
        tipo: "COMPLIANCE",
        ruolo,
      })),
    }),
    prisma.farmacoControlloMensile.createMany({
      data: Array.from({ length: 12 }, (_, i) => ({
        studioId,
        anno: year,
        mese: i + 1,
      })),
    }),
  ]);
}
