"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireActiveSubscription } from "@/lib/auth-guards";

/** Ricalcola il fatturato del giorno = chiusura POS + somma degli incassi
 * (contanti/assegno) registrati per quella data — chiamata dopo ogni
 * creazione/modifica/eliminazione di un incasso o della chiusura POS, così
 * il fatturato mostrato in KPI Studio resta sempre allineato alla Cassa.
 * Se per un giorno non si usa la Cassa, il valore inserito a mano in KPI
 * Studio resta quello (qui non viene mai toccato un giorno senza movimenti
 * e senza chiusura POS diversa da zero già salvata). */
async function ricalcolaFatturatoGiorno(studioId: string, data: Date) {
  const [giorno, incassi] = await Promise.all([
    prisma.kpiGiornaliero.findUnique({ where: { studioId_data: { studioId, data } } }),
    prisma.movimentoCassa.aggregate({
      where: { studioId, tipo: "INCASSO", data },
      _sum: { importo: true },
    }),
  ]);

  const chiusuraPos = giorno?.chiusuraPos ?? 0;
  const totaleIncassi = incassi._sum.importo ?? 0;
  const fatturato = chiusuraPos + totaleIncassi;

  await prisma.kpiGiornaliero.upsert({
    where: { studioId_data: { studioId, data } },
    update: { fatturato },
    create: { studioId, data, fatturato },
  });
}

function parseDate(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  return str ? new Date(str) : new Date();
}

function movimentoPayload(formData: FormData) {
  const tipo = String(formData.get("tipo") ?? "INCASSO");
  return {
    tipo,
    data: parseDate(formData.get("data")),
    importo: Number(formData.get("importo") ?? 0) || 0,
    // Ha senso solo per un incasso: per prelievi/versamenti resta vuoto anche
    // se il form li avesse inviati.
    modalitaIncasso: tipo === "INCASSO" ? String(formData.get("modalitaIncasso") ?? "CONTANTI") : null,
    numeroFattura: tipo === "INCASSO" ? String(formData.get("numeroFattura") ?? "").trim() || null : null,
    // Utile soprattutto per bonifici e prelievi/versamenti, ma disponibile
    // per qualsiasi movimento — non solo per chi non è un incasso.
    nominativo: String(formData.get("nominativo") ?? "").trim() || null,
    note: String(formData.get("note") ?? "").trim() || null,
  };
}

export async function createMovimentoCassa(formData: FormData) {
  const { studio } = await requireActiveSubscription("kpi");
  const data = movimentoPayload(formData);

  await prisma.movimentoCassa.create({ data: { studioId: studio.id, ...data } });
  if (data.tipo === "INCASSO") {
    await ricalcolaFatturatoGiorno(studio.id, data.data);
  }

  revalidatePath("/app/kpi/cassa");
  revalidatePath("/app/kpi");
  revalidatePath("/app");
  redirect("/app/kpi/cassa");
}

export async function updateMovimentoCassa(id: string, formData: FormData) {
  const { studio } = await requireActiveSubscription("kpi");
  const precedente = await prisma.movimentoCassa.findFirst({ where: { id, studioId: studio.id } });
  const data = movimentoPayload(formData);

  await prisma.movimentoCassa.updateMany({ where: { id, studioId: studio.id }, data });

  // Ricalcola sia il giorno vecchio (se l'incasso è stato spostato o non è
  // più un incasso) sia quello nuovo, per non lasciare un fatturato sballato
  // sulla data di partenza.
  if (precedente?.tipo === "INCASSO") await ricalcolaFatturatoGiorno(studio.id, precedente.data);
  if (data.tipo === "INCASSO") await ricalcolaFatturatoGiorno(studio.id, data.data);

  revalidatePath("/app/kpi/cassa");
  revalidatePath("/app/kpi");
  revalidatePath("/app");
  redirect("/app/kpi/cassa");
}

export async function deleteMovimentoCassa(id: string) {
  const { studio } = await requireActiveSubscription("kpi");
  const movimento = await prisma.movimentoCassa.findFirst({ where: { id, studioId: studio.id } });
  if (!movimento) return;

  await prisma.movimentoCassa.deleteMany({ where: { id, studioId: studio.id } });
  if (movimento.tipo === "INCASSO") {
    await ricalcolaFatturatoGiorno(studio.id, movimento.data);
  }

  revalidatePath("/app/kpi/cassa");
  revalidatePath("/app/kpi");
  revalidatePath("/app");
}

/** Chiusura giornaliera del POS: un totale unico al giorno (non per singola
 * transazione, a differenza degli incassi in contanti/assegno). */
export async function salvaChiusuraPos(formData: FormData) {
  const { studio } = await requireActiveSubscription("kpi");
  const data = parseDate(formData.get("data"));
  const chiusuraPos = Number(formData.get("chiusuraPos") ?? 0) || 0;

  await prisma.kpiGiornaliero.upsert({
    where: { studioId_data: { studioId: studio.id, data } },
    update: { chiusuraPos },
    create: { studioId: studio.id, data, chiusuraPos },
  });
  await ricalcolaFatturatoGiorno(studio.id, data);

  revalidatePath("/app/kpi/cassa");
  revalidatePath("/app/kpi");
  revalidatePath("/app");
  redirect("/app/kpi/cassa");
}
