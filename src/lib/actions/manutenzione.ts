"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudio } from "@/lib/auth-guards";
import { TIPI_MANUTENZIONE_DEFAULT, slugifyTipo } from "@/lib/manutenzione";

/** Crea i tipi di controllo predefiniti per lo studio al primo utilizzo del
 * modulo (idempotente: non duplica se già presenti). Lo studio può poi
 * modificarne la cadenza o aggiungerne di personalizzati dalla voce "Altro". */
export async function ensureTipiManutenzione() {
  const { studio } = await requireStudio();
  const esistenti = await prisma.tipoManutenzione.findMany({ where: { studioId: studio.id } });
  const chiaviEsistenti = new Set(esistenti.map((t) => t.chiave));
  const mancanti = TIPI_MANUTENZIONE_DEFAULT.filter((t) => !chiaviEsistenti.has(t.chiave));
  if (mancanti.length > 0) {
    await prisma.tipoManutenzione.createMany({
      data: mancanti.map((t) => ({ studioId: studio.id, chiave: t.chiave, nome: t.nome, cadenzaGiorni: t.cadenzaGiorni })),
      skipDuplicates: true,
    });
  }
}

const NUOVO_TIPO_VALUE = "__NUOVO__";

async function risolviTipo(studioId: string, formData: FormData): Promise<string> {
  const tipoEsistente = String(formData.get("tipoEsistente") ?? "").trim();
  if (tipoEsistente && tipoEsistente !== NUOVO_TIPO_VALUE) return tipoEsistente;

  const nomeNuovo = String(formData.get("tipoNuovo") ?? "").trim();
  if (!nomeNuovo) throw new Error("Indica il nome del nuovo tipo di controllo.");
  const chiave = slugifyTipo(nomeNuovo);
  await prisma.tipoManutenzione.upsert({
    where: { studioId_chiave: { studioId, chiave } },
    update: {},
    create: { studioId, chiave, nome: nomeNuovo, cadenzaGiorni: null },
  });
  return chiave;
}

function payload(tipo: string, formData: FormData) {
  const dataRaw = String(formData.get("data") ?? "");
  return {
    tipo,
    data: dataRaw ? new Date(dataRaw) : new Date(),
    operatore: String(formData.get("operatore") ?? "").trim(),
    esito: String(formData.get("esito") ?? "OK"),
    note: String(formData.get("note") ?? "").trim() || null,
  };
}

export async function creaManutenzione(formData: FormData) {
  const { studio } = await requireStudio();
  const tipo = await risolviTipo(studio.id, formData);
  const data = payload(tipo, formData);
  if (!data.operatore) throw new Error("L'operatore è obbligatorio: chi ha eseguito il controllo deve firmarlo.");
  await prisma.manutenzioneLog.create({ data: { studioId: studio.id, ...data } });
  revalidatePath("/app/manutenzione");
  revalidatePath("/app");
  redirect("/app/manutenzione");
}

export async function eliminaManutenzione(id: string) {
  const { studio } = await requireStudio();
  await prisma.manutenzioneLog.deleteMany({ where: { id, studioId: studio.id } });
  revalidatePath("/app/manutenzione");
  revalidatePath("/app");
}

/** Aggiorna la cadenza attesa (in giorni) di un tipo di controllo. Vuoto/0 =
 * nessuna cadenza impostata: quel tipo non genera mai l'avviso "in ritardo". */
export async function aggiornaCadenzaTipo(id: string, formData: FormData) {
  const { studio } = await requireStudio();
  const raw = String(formData.get("cadenzaGiorni") ?? "").trim();
  const cadenzaGiorni = raw ? Math.max(1, Number(raw) || 0) || null : null;
  await prisma.tipoManutenzione.updateMany({ where: { id, studioId: studio.id }, data: { cadenzaGiorni } });
  revalidatePath("/app/manutenzione");
  revalidatePath("/app");
}
