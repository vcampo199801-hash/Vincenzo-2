"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { SOGLIA_SEGNALAZIONI } from "@/lib/forum";

export async function attivaForum() {
  const { studio } = await requireActiveSubscription("forum");
  await prisma.studio.update({ where: { id: studio.id }, data: { forumAttivo: true } });
  revalidatePath("/app/forum");
  revalidatePath("/app/impostazioni");
}

export async function disattivaForum() {
  const { studio } = await requireActiveSubscription("forum");
  await prisma.studio.update({ where: { id: studio.id }, data: { forumAttivo: false } });
  revalidatePath("/app/forum");
  revalidatePath("/app/impostazioni");
}

export async function creaPost(formData: FormData) {
  const { studio } = await requireActiveSubscription("forum");
  if (!studio.forumAttivo) redirect("/app/forum");

  const categoria = String(formData.get("categoria") ?? "BACHECA");
  const titolo = String(formData.get("titolo") ?? "").trim();
  const corpo = String(formData.get("corpo") ?? "").trim();
  if (!titolo || !corpo) redirect("/app/forum/nuovo");

  const post = await prisma.forumPost.create({
    data: {
      studioId: studio.id,
      categoria,
      titolo,
      corpo,
    },
  });

  revalidatePath("/app/forum");
  redirect(`/app/forum/${post.id}`);
}

export async function creaCommento(postId: string, formData: FormData) {
  const { studio } = await requireActiveSubscription("forum");
  if (!studio.forumAttivo) redirect("/app/forum");

  const corpo = String(formData.get("corpo") ?? "").trim();
  if (!corpo) return;

  const post = await prisma.forumPost.findUnique({ where: { id: postId }, select: { studioId: true } });
  // Se rispondo al mio stesso post non c'è nulla da notificarmi: parte già "letto".
  const lettoDaAutore = !post || post.studioId === studio.id;

  await prisma.forumCommento.create({ data: { postId, studioId: studio.id, corpo, lettoDaAutore } });
  revalidatePath(`/app/forum/${postId}`);
  // Il pallino di notifica vive nel layout (menu), non nella pagina del post:
  // va invalidato esplicitamente perché torni corretto per l'autore del post.
  revalidatePath("/app", "layout");
}

/** Silenzia/riattiva i promemoria email per le nuove risposte a QUESTO post
 * — non tocca il pallino di notifica in-app, solo l'email di riepilogo. */
export async function toggleNotificaPost(postId: string) {
  const { studio } = await requireActiveSubscription("forum");
  const post = await prisma.forumPost.findFirst({ where: { id: postId, studioId: studio.id } });
  if (!post) return;
  await prisma.forumPost.update({ where: { id: postId }, data: { notificaSilenziata: !post.notificaSilenziata } });
  revalidatePath(`/app/forum/${postId}`);
}

export async function eliminaPost(id: string) {
  const { studio } = await requireActiveSubscription("forum");
  await prisma.forumPost.deleteMany({ where: { id, studioId: studio.id } });
  revalidatePath("/app/forum");
  redirect("/app/forum");
}

export async function eliminaCommento(postId: string, id: string) {
  const { studio } = await requireActiveSubscription("forum");
  await prisma.forumCommento.deleteMany({ where: { id, studioId: studio.id } });
  revalidatePath(`/app/forum/${postId}`);
}

/** Ogni studio può segnalare un post una sola volta (nessun'altra
 * segnalazione viene creata se ne esiste già una di questo studio). Oltre
 * SOGLIA_SEGNALAZIONI il post viene nascosto in automatico — non c'è un
 * pannello di moderazione umana, quindi l'auto-hide è l'unica difesa. */
export async function segnalaPost(id: string) {
  const { studio } = await requireActiveSubscription("forum");

  const esistente = await prisma.forumSegnalazione.findFirst({ where: { postId: id, studioId: studio.id } });
  if (!esistente) {
    await prisma.forumSegnalazione.create({ data: { postId: id, studioId: studio.id } });
  }

  const count = await prisma.forumSegnalazione.count({ where: { postId: id } });
  if (count >= SOGLIA_SEGNALAZIONI) {
    await prisma.forumPost.update({ where: { id }, data: { nascosto: true } });
  }

  revalidatePath(`/app/forum/${id}`);
  revalidatePath("/app/forum");
}

export async function segnalaCommento(postId: string, id: string) {
  const { studio } = await requireActiveSubscription("forum");

  const esistente = await prisma.forumSegnalazione.findFirst({ where: { commentoId: id, studioId: studio.id } });
  if (!esistente) {
    await prisma.forumSegnalazione.create({ data: { commentoId: id, studioId: studio.id } });
  }

  const count = await prisma.forumSegnalazione.count({ where: { commentoId: id } });
  if (count >= SOGLIA_SEGNALAZIONI) {
    await prisma.forumCommento.update({ where: { id }, data: { nascosto: true } });
  }

  revalidatePath(`/app/forum/${postId}`);
}
