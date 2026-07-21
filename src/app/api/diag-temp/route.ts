import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// TEMPORARY diagnostic route to figure out what's really in the production
// database behind the Sensitive DATABASE_URL env var (unreadable from the
// Vercel dashboard, but available to runtime Functions). Returns only row
// counts, never personal data. Gated by DIAG_SECRET. Remove after use.
export const dynamic = "force-dynamic";

async function safeCount(fn: () => Promise<number>): Promise<number | string> {
  try {
    return await fn();
  } catch (err) {
    return `errore: ${err instanceof Error ? err.message : String(err)}`;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  if (!process.env.DIAG_SECRET || secret !== process.env.DIAG_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (url.searchParams.get("fix") === "1") {
    const result = await prisma.$executeRawUnsafe(
      `DELETE FROM "_prisma_migrations" WHERE migration_name = '20260721144412_redefine_personale_simple'`
    );
    return NextResponse.json({ fixed: true, rowsDeleted: result });
  }

  const migrazioni = await safeCount(async () => {
    const rows = await prisma.$queryRawUnsafe<{ migration_name: string; finished_at: Date | null }[]>(
      `SELECT migration_name, finished_at FROM "_prisma_migrations" WHERE finished_at IS NULL`
    );
    return rows.length;
  });

  const dbHost = (() => {
    try {
      return new URL(process.env.DATABASE_URL ?? "").host;
    } catch {
      return "sconosciuto";
    }
  })();

  return NextResponse.json({
    dbHost,
    migrazioniFallite: migrazioni,
    utenti: await safeCount(() => prisma.user.count()),
    studi: await safeCount(() => prisma.studio.count()),
    dipendenti: await safeCount(() => prisma.dipendente.count()),
    laboratori: await safeCount(() => prisma.laboratorio.count()),
    abbonamenti: await safeCount(() => prisma.subscription.count()),
  });
}
