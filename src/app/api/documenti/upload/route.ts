import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveSubscription } from "@/lib/auth-guards";

// Genera un token di caricamento scoped (studio + documento), così il file
// va dal browser direttamente a Vercel Blob senza passare dal corpo di una
// nostra Function — il limite di Vercel sulle Function (4.5 MB) altrimenti
// avrebbe fatto fallire in silenzio una normale foto scattata da telefono.
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const { studio } = await requireActiveSubscription("documenti");
        const parsed = clientPayload ? (JSON.parse(clientPayload) as { documentoId?: string }) : {};
        if (!parsed.documentoId) throw new Error("Richiesta non valida.");

        const documento = await prisma.documento.findFirst({ where: { id: parsed.documentoId, studioId: studio.id } });
        if (!documento) throw new Error("Documento non trovato.");

        return {
          allowedContentTypes: ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
          addRandomSuffix: true,
          maximumSizeInBytes: 20 * 1024 * 1024,
        };
      },
      // Nessun onUploadCompleted: è un webhook che Vercel richiama lui stesso
      // in modo asincrono (non raggiungibile da un ambiente locale) — il
      // salvataggio del file sul Documento avviene invece subito dopo che
      // upload() restituisce l'URL al client, vedi confirmDocumentoFile.
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Errore nella generazione del token di caricamento." }, { status: 400 });
  }
}
