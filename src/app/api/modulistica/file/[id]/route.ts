import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudio } from "@/lib/auth-guards";

// Nessun file della Modulistica (PDF compilati, immagini di firma) è mai
// servito da URL pubblico diretto: il record salva l'URL reale su Vercel
// Blob, ma il browser vede solo questa route, che verifica sessione +
// appartenenza allo studio prima di scaricare e ri-trasmettere il file.
export const dynamic = "force-dynamic";

const CAMPO_URL: Record<string, "pdfFileUrl" | "firmaPazienteUrl" | "firmaGenitore1Url" | "firmaGenitore2Url" | "firmaOdontoiatraUrl"> = {
  pdf: "pdfFileUrl",
  firmaPaziente: "firmaPazienteUrl",
  firmaGenitore1: "firmaGenitore1Url",
  firmaGenitore2: "firmaGenitore2Url",
  firmaOdontoiatra: "firmaOdontoiatraUrl",
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { studio } = await requireStudio();
  const { id } = await params;
  const campo = CAMPO_URL[req.nextUrl.searchParams.get("campo") ?? "pdf"] ?? "pdfFileUrl";

  const record = await prisma.moduloCompilato.findFirst({ where: { id, studioId: studio.id } });
  const fileUrl = record?.[campo];
  if (!record || !fileUrl) {
    return NextResponse.json({ error: "File non trovato." }, { status: 404 });
  }

  const res = await fetch(fileUrl);
  if (!res.ok) {
    return NextResponse.json({ error: "Impossibile recuperare il file dallo storage." }, { status: 502 });
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const isPdf = campo === "pdfFileUrl";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": isPdf ? "application/pdf" : "image/png",
      "Content-Disposition": isPdf ? `inline; filename="${record.templateKey}.pdf"` : "inline",
    },
  });
}
