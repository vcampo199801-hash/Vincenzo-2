"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudio } from "@/lib/auth-guards";

function parseDate(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  return str ? new Date(str) : null;
}

function payload(formData: FormData) {
  return {
    categoria: String(formData.get("categoria") ?? "Altro"),
    prodotto: String(formData.get("prodotto") ?? "").trim(),
    fornitore: String(formData.get("fornitore") ?? "").trim() || null,
    unita: String(formData.get("unita") ?? "pz"),
    scortaMinima: Number(formData.get("scortaMinima") ?? 0) || 0,
    quantitaAttuale: Number(formData.get("quantitaAttuale") ?? 0) || 0,
    scadenzaLotto: parseDate(formData.get("scadenzaLotto")),
    prezzoUnitario: Number(formData.get("prezzoUnitario") ?? 0) || 0,
    codice: String(formData.get("codice") ?? "").trim() || null,
    note: String(formData.get("note") ?? "").trim() || null,
    notificaSilenziata: formData.get("notificaSilenziata") === "on",
  };
}

async function ricordaCodice(studioId: string, data: ReturnType<typeof payload>) {
  if (!data.codice) return;
  await prisma.magazzinoCodiceMemoria.upsert({
    where: { studioId_codice: { studioId, codice: data.codice } },
    create: {
      studioId,
      codice: data.codice,
      categoria: data.categoria,
      prodotto: data.prodotto,
      fornitore: data.fornitore,
      unita: data.unita,
      scortaMinima: data.scortaMinima,
      prezzoUnitario: data.prezzoUnitario,
    },
    update: {
      categoria: data.categoria,
      prodotto: data.prodotto,
      fornitore: data.fornitore,
      unita: data.unita,
      scortaMinima: data.scortaMinima,
      prezzoUnitario: data.prezzoUnitario,
    },
  });
}

export async function createMagazzinoItem(formData: FormData) {
  const { studio } = await requireStudio();
  const data = payload(formData);
  await prisma.magazzinoItem.create({ data: { studioId: studio.id, ...data } });
  await ricordaCodice(studio.id, data);
  revalidatePath("/app/magazzino");
  revalidatePath("/app");
  redirect("/app/magazzino");
}

export async function updateMagazzinoItem(id: string, formData: FormData) {
  const { studio } = await requireStudio();
  const data = payload(formData);
  await prisma.magazzinoItem.updateMany({ where: { id, studioId: studio.id }, data });
  await ricordaCodice(studio.id, data);
  revalidatePath("/app/magazzino");
  revalidatePath("/app");
  redirect("/app/magazzino");
}

export async function deleteMagazzinoItem(id: string) {
  const { studio } = await requireStudio();
  await prisma.magazzinoItem.deleteMany({ where: { id, studioId: studio.id } });
  revalidatePath("/app/magazzino");
  revalidatePath("/app");
}

/** Cerca nella memoria dei codici già scansionati in passato, per
 * precompilare la scheda quando si scansiona un prodotto già visto (es. un
 * riordino) — così la scansione non serve solo a leggere il codice, ma
 * evita di riscrivere da capo nome, categoria, fornitore ecc. La memoria
 * sopravvive alla cancellazione dell'articolo dal magazzino: se un prodotto
 * esaurito viene tolto e poi riordinato mesi dopo, il codice lo ritrova lo
 * stesso. Restituisce i soli campi descrittivi: quantità, lotto e scadenza
 * restano quelli letti dalla scansione appena fatta (o da inserire a mano),
 * perché cambiano a ogni arrivo di merce. */
export async function cercaArticoloPerCodice(codice: string) {
  const { studio } = await requireStudio();
  const trimmed = codice.trim();
  if (!trimmed) return null;
  const ricordo = await prisma.magazzinoCodiceMemoria.findUnique({
    where: { studioId_codice: { studioId: studio.id, codice: trimmed } },
  });
  if (!ricordo) return null;
  return {
    prodotto: ricordo.prodotto,
    categoria: ricordo.categoria,
    fornitore: ricordo.fornitore ?? "",
    unita: ricordo.unita,
    scortaMinima: String(ricordo.scortaMinima),
    prezzoUnitario: String(ricordo.prezzoUnitario),
  };
}

/** Regola rapidamente la quantità attuale dall'elenco, senza aprire la scheda
 * dell'articolo (frecce +/- nella tabella). Non scende mai sotto zero. Resta
 * senza costo/data: è la correzione veloce, non il riordino tracciato. */
export async function regolaQuantita(id: string, delta: number) {
  const { studio } = await requireStudio();
  const item = await prisma.magazzinoItem.findFirst({ where: { id, studioId: studio.id } });
  if (!item) return;
  await prisma.magazzinoItem.update({
    where: { id },
    data: { quantitaAttuale: Math.max(0, item.quantitaAttuale + delta) },
  });
  revalidatePath("/app/magazzino");
  revalidatePath("/app");
}

export type RegistraRiordinoState = { error?: string; success?: string } | undefined;

/** Riordino esplicito con data e costo: alimenta sia il resoconto Magazzino
 * sia, se lo studio lo attiva, il Bilancio generale. Aumenta anche la
 * quantità attuale, come le frecce +/-, ma qui l'aumento è tracciato. */
export async function registraRiordino(
  itemId: string,
  _prev: RegistraRiordinoState,
  formData: FormData
): Promise<RegistraRiordinoState> {
  const { studio } = await requireStudio();
  const item = await prisma.magazzinoItem.findFirst({ where: { id: itemId, studioId: studio.id } });
  if (!item) return { error: "Articolo non trovato." };

  const quantita = Number(formData.get("quantita") ?? 0);
  if (!quantita || quantita <= 0) {
    return { error: "Indica una quantità maggiore di zero." };
  }
  const costoRaw = String(formData.get("costo") ?? "").trim();
  const costo = costoRaw ? Math.max(0, Number(costoRaw) || 0) : 0;
  const dataRaw = String(formData.get("data") ?? "").trim();
  const data = dataRaw ? new Date(dataRaw) : new Date();

  await prisma.$transaction([
    prisma.movimentoMagazzino.create({ data: { studioId: studio.id, magazzinoItemId: itemId, quantita, costo, data } }),
    prisma.magazzinoItem.update({ where: { id: itemId }, data: { quantitaAttuale: item.quantitaAttuale + quantita } }),
  ]);

  revalidatePath("/app/magazzino");
  revalidatePath("/app/magazzino/resoconto");
  revalidatePath("/app");
  return { success: "Riordino registrato." };
}

export async function setMagazzinoInBilancio(attivo: boolean) {
  const { studio } = await requireStudio();
  await prisma.studio.update({ where: { id: studio.id }, data: { magazzinoInBilancio: attivo } });
  revalidatePath("/app/magazzino");
  revalidatePath("/app");
}
