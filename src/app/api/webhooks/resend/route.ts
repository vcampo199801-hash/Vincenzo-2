import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";

/** Riceve gli eventi di Resend (Dashboard → Webhooks) per sapere quali email
 * mandate da /admin/comunicazioni sono state aperte. Finché questo webhook
 * non è collegato in Resend (serve anche attivare l'Open Tracking sul
 * dominio), l'evento non arriva mai e apertaAt resta sempre null — non è un
 * errore, è solo la funzione non ancora configurata lato Resend. */
export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook non configurato" }, { status: 501 });
  }

  const payload = await req.text();
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Firma mancante" }, { status: 400 });
  }

  let event: { type?: string; data?: { email_id?: string } };
  try {
    event = new Webhook(secret).verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as typeof event;
  } catch {
    return NextResponse.json({ error: "Firma non valida" }, { status: 400 });
  }

  if (event.type === "email.opened" && event.data?.email_id) {
    await prisma.comunicazioneInvio.updateMany({
      where: { resendId: event.data.email_id, apertaAt: null },
      data: { apertaAt: new Date() },
    });
  }

  return NextResponse.json({ received: true });
}
