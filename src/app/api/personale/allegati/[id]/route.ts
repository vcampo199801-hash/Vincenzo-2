import { NextResponse } from "next/server";
import { requirePersonaleAccess } from "@/lib/auth-guards";
import { logPersonaleAccess } from "@/lib/personale-access-log";
import { downloadDecryptedAttachment } from "@/lib/attachments";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { studio, session } = await requirePersonaleAccess();
  const { id } = await params;

  const file = await downloadDecryptedAttachment(id, studio.id);
  if (!file) {
    return NextResponse.json({ error: "Allegato non trovato." }, { status: 404 });
  }

  await logPersonaleAccess({ studioId: studio.id, userId: session.userId, azione: "VIEW_ALLEGATO" });

  return new NextResponse(new Uint8Array(file.buffer), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(file.nomeFile)}"`,
    },
  });
}
