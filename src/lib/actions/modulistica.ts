"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { put, del } from "@vercel/blob";
import { PDFDocument as CantooPDFDocument } from "@cantoo/pdf-lib";
import { prisma } from "@/lib/prisma";
import { requireStudio } from "@/lib/auth-guards";
import { getTemplate } from "@/lib/modulistica-templates";
import { idCampiTemplate, isModulisticaStorageConfigured, costruisciPasswordPdf } from "@/lib/modulistica";
import { generateModuloPdfBuffer } from "@/lib/modulistica-pdf";

export type ModulisticaFormState = { error?: string } | undefined;

function pazientePayload(formData: FormData) {
  const dataNascitaRaw = String(formData.get("dataNascita") ?? "");
  return {
    nome: String(formData.get("nome") ?? "").trim(),
    cognome: String(formData.get("cognome") ?? "").trim(),
    dataNascita: dataNascitaRaw ? new Date(dataNascitaRaw) : null,
    luogoNascita: String(formData.get("luogoNascita") ?? "").trim() || null,
    codiceFiscale: String(formData.get("codiceFiscale") ?? "").trim().toUpperCase() || null,
    residenza: String(formData.get("residenza") ?? "").trim() || null,
    telefono: String(formData.get("telefono") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    medicoCurante: String(formData.get("medicoCurante") ?? "").trim() || null,
    professione: String(formData.get("professione") ?? "").trim() || null,
    note: String(formData.get("note") ?? "").trim() || null,
  };
}

export async function createPaziente(formData: FormData) {
  const { studio } = await requireStudio();
  const payload = pazientePayload(formData);
  if (!payload.nome || !payload.cognome) {
    throw new Error("Nome e cognome sono obbligatori.");
  }
  const paziente = await prisma.paziente.create({ data: { studioId: studio.id, ...payload } });
  revalidatePath("/app/modulistica");
  redirect(`/app/modulistica/pazienti/${paziente.id}`);
}

export async function updatePaziente(id: string, formData: FormData) {
  const { studio } = await requireStudio();
  await prisma.paziente.updateMany({ where: { id, studioId: studio.id }, data: pazientePayload(formData) });
  revalidatePath(`/app/modulistica/pazienti/${id}`);
  redirect(`/app/modulistica/pazienti/${id}`);
}

export async function deletePaziente(id: string) {
  const { studio } = await requireStudio();
  const moduli = await prisma.moduloCompilato.findMany({ where: { pazienteId: id, studioId: studio.id } });
  await Promise.all(
    moduli.flatMap((m) => [m.pdfFileUrl, m.firmaPazienteUrl, m.firmaGenitore1Url, m.firmaGenitore2Url, m.firmaOdontoiatraUrl].filter((u): u is string => Boolean(u)).map((u) => del(u).catch(() => {})))
  );
  await prisma.paziente.deleteMany({ where: { id, studioId: studio.id } });
  revalidatePath("/app/modulistica");
  redirect("/app/modulistica");
}

/** Legge dal FormData tutti i campi/checkbox previsti dal template (generico
 * per i 18 template, non serve un parser per ciascuno). */
function estraiDati(template: ReturnType<typeof getTemplate>, formData: FormData): Record<string, string> {
  const dati: Record<string, string> = {};
  if (!template) return dati;
  for (const id of idCampiTemplate(template)) {
    const value = formData.get(id);
    if (value === "on") dati[id] = "true";
    else if (typeof value === "string" && value) dati[id] = value;
  }
  return dati;
}

export async function compilaModulo(pazienteId: string, templateKey: string, _prev: ModulisticaFormState, formData: FormData): Promise<ModulisticaFormState> {
  const { studio } = await requireStudio();
  const template = getTemplate(templateKey);
  if (!template) return { error: "Modulo non riconosciuto." };

  if (!isModulisticaStorageConfigured()) {
    return { error: "L'archiviazione dei documenti non è ancora configurata su questa istanza." };
  }

  const paziente = await prisma.paziente.findFirst({ where: { id: pazienteId, studioId: studio.id } });
  if (!paziente) return { error: "Paziente non trovato." };

  const dati = estraiDati(template, formData);
  const luogo = String(formData.get("luogo") ?? "").trim() || null;
  const dataRaw = String(formData.get("data") ?? "");
  const data = dataRaw ? new Date(dataRaw) : new Date();
  const genitore1Nome = String(formData.get("genitore1Nome") ?? "").trim() || undefined;
  const genitore2Nome = String(formData.get("genitore2Nome") ?? "").trim() || undefined;
  const testimoneNome = String(formData.get("testimoneNome") ?? "").trim() || undefined;

  let consenso: string | undefined;
  const consensoMultiplo: Record<string, "PRESTO" | "NEGO"> = {};
  if (template.tipoConsenso === "binario" || template.tipoConsenso === "pedodonzia") {
    consenso = String(formData.get("consenso") ?? "") || undefined;
  } else if (template.tipoConsenso === "multiplo" && template.consensoMultiploVoci) {
    for (const voce of template.consensoMultiploVoci) {
      const scelta = String(formData.get(`consenso_${voce.id}`) ?? "");
      if (scelta === "PRESTO" || scelta === "NEGO") consensoMultiplo[voce.id] = scelta;
    }
  }

  const firmaPazienteDataUrl = String(formData.get("firmaPaziente") ?? "") || null;
  const firmaGenitore1DataUrl = String(formData.get("firmaGenitore1") ?? "") || null;
  const firmaGenitore2DataUrl = String(formData.get("firmaGenitore2") ?? "") || null;
  const firmaOdontoiatraDataUrl = String(formData.get("firmaOdontoiatra") ?? "") || null;

  const pdfBuffer = await generateModuloPdfBuffer({
    studio: {
      name: studio.name,
      indirizzo: studio.indirizzo,
      citta: studio.citta,
      telefono: studio.telefono,
      email: studio.email,
      titolare: studio.titolare,
      numeroAlboTitolare: studio.numeroAlboTitolare,
    },
    paziente,
    template,
    dati,
    consenso,
    consensoMultiplo,
    luogo,
    data,
    genitore1Nome,
    genitore2Nome,
    testimoneNome,
    firmaPazienteDataUrl,
    firmaGenitore1DataUrl,
    firmaGenitore2DataUrl,
    firmaOdontoiatraDataUrl,
  });

  const numeroPassword = String(formData.get("passwordNumero") ?? "").trim();
  let pdfFinaleBuffer: Buffer = pdfBuffer;
  if (numeroPassword) {
    const password = costruisciPasswordPdf(paziente.dataNascita, numeroPassword);
    const doc = await CantooPDFDocument.load(pdfBuffer);
    doc.encrypt({ userPassword: password, ownerPassword: `${password}-owner-${studio.id}` });
    pdfFinaleBuffer = Buffer.from(await doc.save());
  }

  const prefix = `modulistica/${studio.id}/${pazienteId}/${templateKey}-${Date.now()}`;
  const [pdfBlob, firmaPazienteBlob, firmaGenitore1Blob, firmaGenitore2Blob, firmaOdontoiatraBlob] = await Promise.all([
    put(`${prefix}.pdf`, pdfFinaleBuffer, { access: "public", addRandomSuffix: true, contentType: "application/pdf" }),
    caricaFirma(firmaPazienteDataUrl, `${prefix}-firma-paziente.png`),
    caricaFirma(firmaGenitore1DataUrl, `${prefix}-firma-genitore1.png`),
    caricaFirma(firmaGenitore2DataUrl, `${prefix}-firma-genitore2.png`),
    caricaFirma(firmaOdontoiatraDataUrl, `${prefix}-firma-odontoiatra.png`),
  ]);

  await prisma.moduloCompilato.create({
    data: {
      studioId: studio.id,
      pazienteId,
      templateKey,
      dati: JSON.stringify({ ...dati, consenso, consensoMultiplo, genitore1Nome, genitore2Nome, testimoneNome }),
      luogo,
      data,
      firmaPazienteUrl: firmaPazienteBlob?.url,
      firmaGenitore1Url: firmaGenitore1Blob?.url,
      firmaGenitore2Url: firmaGenitore2Blob?.url,
      firmaOdontoiatraUrl: firmaOdontoiatraBlob?.url,
      stato: "FIRMATO",
      pdfFileUrl: pdfBlob.url,
    },
  });

  revalidatePath(`/app/modulistica/pazienti/${pazienteId}`);
  redirect(`/app/modulistica/pazienti/${pazienteId}`);
}

async function caricaFirma(dataUrl: string | null, path: string) {
  if (!dataUrl || !dataUrl.startsWith("data:image/")) return null;
  const base64 = dataUrl.split(",")[1];
  if (!base64) return null;
  const buffer = Buffer.from(base64, "base64");
  return put(path, buffer, { access: "public", addRandomSuffix: true, contentType: "image/png" });
}

export async function deleteModuloCompilato(id: string, pazienteId: string) {
  const { studio } = await requireStudio();
  const record = await prisma.moduloCompilato.findFirst({ where: { id, studioId: studio.id } });
  if (record) {
    await Promise.all(
      [record.pdfFileUrl, record.firmaPazienteUrl, record.firmaGenitore1Url, record.firmaGenitore2Url, record.firmaOdontoiatraUrl]
        .filter((u): u is string => Boolean(u))
        .map((u) => del(u).catch(() => {}))
    );
    await prisma.moduloCompilato.deleteMany({ where: { id, studioId: studio.id } });
  }
  revalidatePath(`/app/modulistica/pazienti/${pazienteId}`);
}
