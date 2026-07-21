import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudio } from "@/lib/auth-guards";

// Nessun allegato del modulo Laboratori è mai servito da URL pubblico diretto:
// il record salva l'URL reale su Vercel Blob, ma il browser vede solo questa
// route, che verifica sessione + appartenenza allo studio prima di scaricare
// e ri-trasmettere il file.
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { studio } = await requireStudio();
  const { id } = await params;

  const record = await prisma.allegatoLaboratorio.findFirst({ where: { id, studioId: studio.id } });
  if (!record) {
    return NextResponse.json({ error: "Documento non trovato." }, { status: 404 });
  }

  const res = await fetch(record.fileUrl);
  if (!res.ok) {
    return NextResponse.json({ error: "Impossibile recuperare il file dallo storage." }, { status: 502 });
  }
  const buffer = Buffer.from(await res.arrayBuffer());

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${record.nomeFile}"`,
    },
  });
}
