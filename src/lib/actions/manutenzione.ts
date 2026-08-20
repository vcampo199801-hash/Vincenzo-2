"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { TIPI_MANUTENZIONE_DEFAULT, slugifyTipo, AUTOCLAVE_PREFIX } from "@/lib/manutenzione";

/** Crea i tipi di controllo predefiniti per lo studio al primo utilizzo del
 * modulo (idempotente: non duplica se già presenti). Lo studio può poi
 * modificarne la cadenza o aggiungerne di personalizzati dalla voce "Altro". */
export async function ensureTipiManutenzione() {
  const { studio } = await requireActiveSubscription("manutenzione");
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
  // Un nuovo test aggiunto da dentro il gruppo "Controllo autoclave" resta
  // raggruppato lì: la chiave prende il prefisso AUTOCLAVE_ e il nome viene
  // preceduto da "Autoclave —", coerente con i test predefiniti.
  const prefissoGruppo = String(formData.get("prefissoGruppo") ?? "").trim();
  const chiaveBase = slugifyTipo(nomeNuovo);
  const chiave = prefissoGruppo && !chiaveBase.startsWith(prefissoGruppo) ? `${prefissoGruppo}${chiaveBase}` : chiaveBase;
  const nome = prefissoGruppo === AUTOCLAVE_PREFIX ? `Autoclave — ${nomeNuovo}` : nomeNuovo;
  await prisma.tipoManutenzione.upsert({
    where: { studioId_chiave: { studioId, chiave } },
    update: {},
    create: { studioId, chiave, nome, cadenzaGiorni: null },
  });
  return chiave;
}

function payload(tipo: string, formData: FormData) {
  const dataRaw = String(formData.get("data") ?? "");
  const costoRaw = String(formData.get("costo") ?? "").trim();
  return {
    tipo,
    data: dataRaw ? new Date(dataRaw) : new Date(),
    operatore: String(formData.get("operatore") ?? "").trim(),
    esito: String(formData.get("esito") ?? "OK"),
    note: String(formData.get("note") ?? "").trim() || null,
    costo: costoRaw ? Math.max(0, Number(costoRaw) || 0) : 0,
  };
}

export async function creaManutenzione(formData: FormData) {
  const { studio } = await requireActiveSubscription("manutenzione");
  const tipo = await risolviTipo(studio.id, formData);
  const data = payload(tipo, formData);
  if (!data.operatore) throw new Error("L'operatore è obbligatorio: chi ha eseguito il controllo deve firmarlo.");
  await prisma.manutenzioneLog.create({ data: { studioId: studio.id, ...data } });
  revalidatePath("/app/manutenzione");
  revalidatePath("/app");
  redirect("/app/manutenzione");
}

export async function eliminaManutenzione(id: string) {
  const { studio } = await requireActiveSubscription("manutenzione");
  await prisma.manutenzioneLog.deleteMany({ where: { id, studioId: studio.id } });
  revalidatePath("/app/manutenzione");
  revalidatePath("/app");
}

/** Elimina un tipo di controllo personalizzato (creato dalla voce "Altro" o
 * "+ Nuovo test autoclave"): sparisce la scheda di riepilogo/cadenza, ma le
 * registrazioni già fatte restano nello storico. I tipi predefiniti non si
 * possono eliminare da qui — ensureTipiManutenzione li ricrea a ogni
 * apertura della pagina, quindi ricomparirebbero subito. */
export async function eliminaTipoManutenzione(id: string) {
  const { studio } = await requireActiveSubscription("manutenzione");
  const tipo = await prisma.tipoManutenzione.findFirst({ where: { id, studioId: studio.id } });
  if (!tipo) return;
  const isPredefinito = TIPI_MANUTENZIONE_DEFAULT.some((t) => t.chiave === tipo.chiave);
  if (isPredefinito) return;
  await prisma.tipoManutenzione.delete({ where: { id } });
  revalidatePath("/app/manutenzione");
}

/** Aggiorna la cadenza attesa (in giorni) di un tipo di controllo. Vuoto/0 =
 * nessuna cadenza impostata: quel tipo non genera mai l'avviso "in ritardo". */
export async function aggiornaCadenzaTipo(id: string, formData: FormData) {
  const { studio } = await requireActiveSubscription("manutenzione");
  const raw = String(formData.get("cadenzaGiorni") ?? "").trim();
  const cadenzaGiorni = raw ? Math.max(1, Number(raw) || 0) || null : null;
  const notificaSilenziata = formData.get("notificaSilenziata") === "on";
  await prisma.tipoManutenzione.updateMany({ where: { id, studioId: studio.id }, data: { cadenzaGiorni, notificaSilenziata } });
  revalidatePath("/app/manutenzione");
  revalidatePath("/app");
}
