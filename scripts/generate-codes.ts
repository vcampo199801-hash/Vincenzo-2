/**
 * Bulk-generates single-use activation codes and writes them to a CSV file,
 * ready to upload into the Shopify app that assigns one code per sale.
 *
 * Usage:
 *   npm run codes:generate -- --count 50 --days 30 --note "Shopify batch 2026-07" --out codes.csv
 */
import { randomInt } from "crypto";
import { writeFileSync } from "fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Unambiguous alphabet: no 0/O, 1/I/L, to reduce typos when customers type the code by hand.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomSegment(length: number) {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[randomInt(ALPHABET.length)];
  }
  return out;
}

function generateCode() {
  return `SIR-${randomSegment(4)}-${randomSegment(4)}-${randomSegment(4)}`;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      const value = args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : "true";
      opts[key] = value;
    }
  }
  return opts;
}

async function main() {
  const opts = parseArgs();
  const count = Number(opts.count ?? 10);
  const days = Number(opts.days ?? 30);
  const note = opts.note ?? null;
  const outPath = opts.out ?? `codes-${Date.now()}.csv`;

  if (!Number.isFinite(count) || count <= 0 || count > 5000) {
    throw new Error("--count deve essere un numero tra 1 e 5000");
  }
  if (!Number.isFinite(days) || days <= 0) {
    throw new Error("--days deve essere un numero positivo");
  }

  const codes: string[] = [];
  while (codes.length < count) {
    const code = generateCode();
    const exists = await prisma.accessCode.findUnique({ where: { code } });
    if (!exists) codes.push(code);
  }

  await prisma.accessCode.createMany({
    data: codes.map((code) => ({ code, days, batchNote: note })),
  });

  writeFileSync(outPath, "code\n" + codes.join("\n") + "\n");
  console.log(`Generati ${count} codici (validità ${days} giorni) -> ${outPath}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
