"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePersonaleAccess } from "@/lib/auth-guards";
import { logPersonaleAccess } from "@/lib/personale-access-log";
import { calcolaScadenzaAdempimento } from "@/lib/personale";
import { uploadEncryptedAttachment, deleteAttachment } from "@/lib/attachments";
import { parseCsvToObjects } from "@/lib/csv";

function parseDate(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  return str ? new Date(str) : null;
}

function parseFloatOrNull(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  if (!str) return null;
  const n = Number(str);
  return Number.isFinite(n) ? n : null;
}

// ---------- Dipendente ----------

function dipendentePayload(formData: FormData) {
  return {
    nome: String(formData.get("nome") ?? "").trim(),
    cognome: String(formData.get("cognome") ?? "").trim(),
    codiceFiscale: String(formData.get("codiceFiscale") ?? "").trim().toUpperCase() || null,
    dataNascita: parseDate(formData.get("dataNascita")),
    mansione: String(formData.get("mansione") ?? "ALTRO"),
    tipoContratto: String(formData.get("tipoContratto") ?? "INDETERMINATO"),
    ccnl: String(formData.get("ccnl") ?? "").trim() || null,
    livello: String(formData.get("livello") ?? "").trim() || null,
    dataAssunzione: parseDate(formData.get("dataAssunzione")),
    dataFineContratto: parseDate(formData.get("dataFineContratto")),
    oreSettimanali: parseFloatOrNull(formData.get("oreSettimanali")),
    finePeriodoProva: parseDate(formData.get("finePeriodoProva")),
    stato: String(formData.get("stato") ?? "ATTIVO"),
    note: String(formData.get("note") ?? "").trim() || null,
    oreSettimanaliFullTime: parseFloatOrNull(formData.get("oreSettimanaliFullTime")) ?? 36,
    ferieAnnueContrattuali: parseFloatOrNull(formData.get("ferieAnnueContrattuali")) ?? 26,
    rolAnnueContrattuali: parseFloatOrNull(formData.get("rolAnnueContrattuali")) ?? 32,
    retribuzioneLordaAnnua: parseFloatOrNull(formData.get("retribuzioneLordaAnnua")),
  };
}

export async function createDipendente(formData: FormData) {
  const { studio, session } = await requirePersonaleAccess();
  const dipendente = await prisma.dipendente.create({ data: { studioId: studio.id, ...dipendentePayload(formData) } });
  await logPersonaleAccess({ studioId: studio.id, userId: session.userId, dipendenteId: dipendente.id, azione: "MODIFICA" });
  revalidatePath("/app/personale");
  redirect(`/app/personale/dipendenti/${dipendente.id}`);
}

export async function updateDipendente(id: string, formData: FormData) {
  const { studio, session } = await requirePersonaleAccess();
  await prisma.dipendente.updateMany({ where: { id, studioId: studio.id }, data: dipendentePayload(formData) });
  await logPersonaleAccess({ studioId: studio.id, userId: session.userId, dipendenteId: id, azione: "MODIFICA" });
  revalidatePath("/app/personale");
  revalidatePath(`/app/personale/dipendenti/${id}`);
  redirect(`/app/personale/dipendenti/${id}`);
}

export async function deleteDipendente(id: string) {
  const { studio, session } = await requirePersonaleAccess();
  await prisma.dipendente.deleteMany({ where: { id, studioId: studio.id } });
  await logPersonaleAccess({ studioId: studio.id, userId: session.userId, dipendenteId: id, azione: "MODIFICA" });
  revalidatePath("/app/personale");
}

// ---------- Movimento assenza ----------

export async function createMovimentoAssenza(dipendenteId: string, formData: FormData) {
  const { studio, session } = await requirePersonaleAccess();
  await prisma.movimentoAssenza.create({
    data: {
      dipendenteId,
      studioId: studio.id,
      tipo: String(formData.get("tipo") ?? "FERIE"),
      dataInizio: parseDate(formData.get("dataInizio")) ?? new Date(),
      dataFine: parseDate(formData.get("dataFine")),
      giorni: parseFloatOrNull(formData.get("giorni")),
      ore: parseFloatOrNull(formData.get("ore")),
      protocolloCertificato: String(formData.get("protocolloCertificato") ?? "").trim() || null,
      note: String(formData.get("note") ?? "").trim() || null,
    },
  });
  await logPersonaleAccess({ studioId: studio.id, userId: session.userId, dipendenteId, azione: "MODIFICA" });
  revalidatePath(`/app/personale/dipendenti/${dipendenteId}`);
  revalidatePath("/app/personale/calendario");
}

export async function deleteMovimentoAssenza(id: string, dipendenteId: string) {
  const { studio, session } = await requirePersonaleAccess();
  await prisma.movimentoAssenza.deleteMany({ where: { id, studioId: studio.id } });
  await logPersonaleAccess({ studioId: studio.id, userId: session.userId, dipendenteId, azione: "MODIFICA" });
  revalidatePath(`/app/personale/dipendenti/${dipendenteId}`);
  revalidatePath("/app/personale/calendario");
}

// ---------- Saldo annuale ----------

export async function upsertSaldoAnnuale(dipendenteId: string, formData: FormData) {
  const { studio, session } = await requirePersonaleAccess();
  const anno = Number(formData.get("anno")) || new Date().getFullYear();

  const data = {
    ferieMaturate: parseFloatOrNull(formData.get("ferieMaturate")) ?? 0,
    ferieGodute: parseFloatOrNull(formData.get("ferieGodute")) ?? 0,
    rolMaturati: parseFloatOrNull(formData.get("rolMaturati")) ?? 0,
    rolGoduti: parseFloatOrNull(formData.get("rolGoduti")) ?? 0,
    giorniMalattiaAnno: parseFloatOrNull(formData.get("giorniMalattiaAnno")) ?? 0,
    giorniComportoMassimo: Math.round(parseFloatOrNull(formData.get("giorniComportoMassimo")) ?? 180),
    tfrAccantonatoInizioAnno: parseFloatOrNull(formData.get("tfrAccantonatoInizioAnno")) ?? 0,
    tfrAccantonatoAnno: parseFloatOrNull(formData.get("tfrAccantonatoAnno")) ?? 0,
    destinazioneTfr: String(formData.get("destinazioneTfr") ?? "").trim() || null,
    retribuzioneUtileAnnua: parseFloatOrNull(formData.get("retribuzioneUtileAnnua")),
    indiceRivalutazioneIstat: parseFloatOrNull(formData.get("indiceRivalutazioneIstat")),
    note: String(formData.get("note") ?? "").trim() || null,
  };

  await prisma.saldoAnnuale.upsert({
    where: { dipendenteId_anno: { dipendenteId, anno } },
    create: { dipendenteId, studioId: studio.id, anno, ...data },
    update: data,
  });
  await logPersonaleAccess({ studioId: studio.id, userId: session.userId, dipendenteId, azione: "MODIFICA" });
  revalidatePath(`/app/personale/dipendenti/${dipendenteId}`);
}

// ---------- Adempimento personale ----------

export async function createAdempimentoPersonale(dipendenteId: string, formData: FormData) {
  const { studio, session } = await requirePersonaleAccess();

  const dataEsecuzione = parseDate(formData.get("dataEsecuzione"));
  const periodicitaMesi = formData.get("periodicitaMesi") ? Number(formData.get("periodicitaMesi")) : null;
  const dataScadenzaManuale = parseDate(formData.get("dataScadenza"));
  const dataScadenza = dataScadenzaManuale ?? calcolaScadenzaAdempimento(dataEsecuzione, periodicitaMesi);

  let fileAllegatoId: string | null = null;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const allegato = await uploadEncryptedAttachment({ studioId: studio.id, userId: session.userId, file });
    fileAllegatoId = allegato.id;
  }

  await prisma.adempimentoPersonale.create({
    data: {
      dipendenteId,
      studioId: studio.id,
      tipologia: String(formData.get("tipologia") ?? ""),
      dataEsecuzione,
      periodicitaMesi,
      dataScadenza,
      esito: String(formData.get("esito") ?? "").trim() || null,
      fileAllegatoId,
      note: String(formData.get("note") ?? "").trim() || null,
    },
  });
  await logPersonaleAccess({ studioId: studio.id, userId: session.userId, dipendenteId, azione: "MODIFICA" });
  revalidatePath(`/app/personale/dipendenti/${dipendenteId}`);
  revalidatePath("/app/personale");
}

export async function deleteAdempimentoPersonale(id: string, dipendenteId: string) {
  const { studio, session } = await requirePersonaleAccess();
  const record = await prisma.adempimentoPersonale.findFirst({ where: { id, studioId: studio.id } });
  if (record?.fileAllegatoId) {
    await deleteAttachment(record.fileAllegatoId, studio.id).catch(() => {});
  }
  await prisma.adempimentoPersonale.deleteMany({ where: { id, studioId: studio.id } });
  await logPersonaleAccess({ studioId: studio.id, userId: session.userId, dipendenteId, azione: "MODIFICA" });
  revalidatePath(`/app/personale/dipendenti/${dipendenteId}`);
  revalidatePath("/app/personale");
}

// ---------- CSV import/export ----------

export type ImportCsvState = { error?: string; success?: string } | undefined;

export async function importDipendentiCsv(_prev: ImportCsvState, formData: FormData): Promise<ImportCsvState> {
  const { studio, session } = await requirePersonaleAccess();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Seleziona un file CSV da importare." };
  }

  const text = await file.text();
  const rows = parseCsvToObjects(text);
  if (rows.length === 0) {
    return { error: "Il file CSV non contiene righe da importare." };
  }

  let creati = 0;
  let aggiornati = 0;

  for (const row of rows) {
    if (!row.nome || !row.cognome) continue;
    const data = {
      nome: row.nome,
      cognome: row.cognome,
      codiceFiscale: row.codiceFiscale?.toUpperCase() || null,
      dataNascita: row.dataNascita ? new Date(row.dataNascita) : null,
      mansione: row.mansione || "ALTRO",
      tipoContratto: row.tipoContratto || "INDETERMINATO",
      ccnl: row.ccnl || null,
      livello: row.livello || null,
      dataAssunzione: row.dataAssunzione ? new Date(row.dataAssunzione) : null,
      dataFineContratto: row.dataFineContratto ? new Date(row.dataFineContratto) : null,
      oreSettimanali: row.oreSettimanali ? Number(row.oreSettimanali) : null,
      finePeriodoProva: row.finePeriodoProva ? new Date(row.finePeriodoProva) : null,
      stato: row.stato || "ATTIVO",
      note: row.note || null,
      oreSettimanaliFullTime: row.oreSettimanaliFullTime ? Number(row.oreSettimanaliFullTime) : 36,
      ferieAnnueContrattuali: row.ferieAnnueContrattuali ? Number(row.ferieAnnueContrattuali) : 26,
      rolAnnueContrattuali: row.rolAnnueContrattuali ? Number(row.rolAnnueContrattuali) : 32,
      retribuzioneLordaAnnua: row.retribuzioneLordaAnnua ? Number(row.retribuzioneLordaAnnua) : null,
    };

    const esistente = data.codiceFiscale
      ? await prisma.dipendente.findFirst({ where: { studioId: studio.id, codiceFiscale: data.codiceFiscale } })
      : null;

    if (esistente) {
      await prisma.dipendente.update({ where: { id: esistente.id }, data });
      aggiornati++;
    } else {
      await prisma.dipendente.create({ data: { studioId: studio.id, ...data } });
      creati++;
    }
  }

  await logPersonaleAccess({ studioId: studio.id, userId: session.userId, azione: "EXPORT_CSV" });
  revalidatePath("/app/personale");
  revalidatePath("/app/personale/dipendenti");
  return { success: `Importazione completata: ${creati} nuovi, ${aggiornati} aggiornati.` };
}
