import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// TEMPORARY diagnostic route — see the real Postgres error Prisma stored for
// the failed migration attempt (the "logs" column), instead of guessing.
// Gated by DIAG_SECRET. Remove after use.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  if (!process.env.DIAG_SECRET || secret !== process.env.DIAG_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (url.searchParams.get("clear") === "1") {
    const name = url.searchParams.get("name");
    if (!name) return NextResponse.json({ error: "missing name" }, { status: 400 });
    const result = await prisma.$executeRawUnsafe(`DELETE FROM "_prisma_migrations" WHERE migration_name = $1`, name);
    return NextResponse.json({ cleared: true, rowsDeleted: result });
  }

  const rows = await prisma.$queryRawUnsafe<
    { migration_name: string; started_at: Date; finished_at: Date | null; rolled_back_at: Date | null; logs: string | null }[]
  >(`SELECT migration_name, started_at, finished_at, rolled_back_at, logs FROM "_prisma_migrations" ORDER BY started_at DESC LIMIT 5`);

  return NextResponse.json({ rows });
}
