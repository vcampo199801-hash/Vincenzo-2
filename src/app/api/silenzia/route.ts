import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verificaTokenSilenzia, creaTokenSilenzia, type TipoVoce } from "@/lib/silence-token";

// Pagina pubblica raggiunta dal link "Silenzia questa voce" nelle email di
// riepilogo: nessun login richiesto, l'autorizzazione è il token firmato
// stesso (contiene studioId+id, quindi l'update resta comunque scoped a
// quello studio). Non deve mai essere prerenderizzata/cachata.
export const dynamic = "force-dynamic";

const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function pagina(titolo: string, corpo: string) {
  const html = `<!doctype html>
<html lang="it">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${titolo} — Scadenze in Regola</title>
  </head>
  <body style="font-family:Arial,Helvetica,sans-serif;background:#f3f9f9;margin:0;padding:40px 20px;color:#0f172a;">
    <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <h1 style="font-size:18px;color:#3d7076;margin-top:0;">Scadenze in Regola</h1>
      ${corpo}
    </div>
  </body>
</html>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

/** Applica il flag notificaSilenziata sul record giusto, scoped a studioId.
 * Ritorna il nome da mostrare in conferma, o null se il record non esiste
 * più (eliminato) o non appartiene a quello studio. */
async function aggiornaFlag(tipo: TipoVoce, id: string, studioId: string, silenzia: boolean): Promise<string | null> {
  if (tipo === "adempimento") {
    const r = await prisma.adempimento.updateMany({ where: { id, studioId }, data: { notificaSilenziata: silenzia } });
    if (r.count === 0) return null;
    return (await prisma.adempimento.findUnique({ where: { id } }))?.nome ?? null;
  }
  if (tipo === "farmaco") {
    const r = await prisma.farmaco.updateMany({ where: { id, studioId }, data: { notificaSilenziata: silenzia } });
    if (r.count === 0) return null;
    return (await prisma.farmaco.findUnique({ where: { id } }))?.nome ?? null;
  }
  if (tipo === "magazzino") {
    const r = await prisma.magazzinoItem.updateMany({ where: { id, studioId }, data: { notificaSilenziata: silenzia } });
    if (r.count === 0) return null;
    return (await prisma.magazzinoItem.findUnique({ where: { id } }))?.prodotto ?? null;
  }
  const r = await prisma.tipoManutenzione.updateMany({ where: { id, studioId }, data: { notificaSilenziata: silenzia } });
  if (r.count === 0) return null;
  return (await prisma.tipoManutenzione.findUnique({ where: { id } }))?.nome ?? null;
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return pagina("Link non valido", `<p>Questo link non è valido.</p><p style="margin-top:20px;"><a href="${APP_URL()}/app" style="color:#4e888f;">Apri Scadenze in Regola</a></p>`);
  }

  let payload;
  try {
    payload = await verificaTokenSilenzia(token);
  } catch {
    return pagina(
      "Link scaduto",
      `<p>Questo link non è più valido (è scaduto o è stato modificato). Puoi comunque gestire i promemoria direttamente dall'app.</p>
       <p style="margin-top:20px;"><a href="${APP_URL()}/app" style="color:#4e888f;">Apri Scadenze in Regola</a></p>`
    );
  }

  const { studioId, tipo, id, silenzia } = payload;
  const nome = await aggiornaFlag(tipo, id, studioId, silenzia);

  if (nome === null) {
    return pagina(
      "Voce non trovata",
      `<p>Non troviamo più questa voce (potrebbe essere stata eliminata o modificata).</p>
       <p style="margin-top:20px;"><a href="${APP_URL()}/app" style="color:#4e888f;">Apri Scadenze in Regola</a></p>`
    );
  }

  const toggleToken = await creaTokenSilenzia({ studioId, tipo, id, silenzia: !silenzia });
  const toggleUrl = `${APP_URL()}/api/silenzia?token=${encodeURIComponent(toggleToken)}`;
  const messaggio = silenzia
    ? `Promemoria silenziato per <strong>${nome}</strong>. Non riceverai più email per questa voce, finché non lo riattivi.`
    : `Promemoria riattivato per <strong>${nome}</strong>. Tornerà a comparire nei riepiloghi finché la scadenza non è risolta.`;
  const azioneLabel = silenzia ? "Riattiva questo promemoria" : "Silenzia di nuovo";

  return pagina(
    silenzia ? "Promemoria silenziato" : "Promemoria riattivato",
    `<p>${messaggio}</p>
     <p style="margin-top:24px;"><a href="${toggleUrl}" style="color:#4e888f;text-decoration:underline;">${azioneLabel}</a></p>
     <p style="margin-top:24px;">
       <a href="${APP_URL()}/app" style="background:#4e888f;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px;">Apri l'app</a>
     </p>`
  );
}
