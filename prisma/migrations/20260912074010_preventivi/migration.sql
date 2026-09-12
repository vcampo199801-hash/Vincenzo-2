-- CreateTable
CREATE TABLE "Preventivo" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "dottore" TEXT NOT NULL,
    "commerciale" TEXT,
    "totaleProposto" DOUBLE PRECISION NOT NULL,
    "totaleAccettato" DOUBLE PRECISION,
    "scadenza" TIMESTAMP(3),
    "assicurazione" BOOLEAN NOT NULL DEFAULT false,
    "modalitaPagamento" TEXT,
    "stato" TEXT NOT NULL DEFAULT 'PRESENTATO',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Preventivo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Preventivo_studioId_idx" ON "Preventivo"("studioId");

-- AddForeignKey
ALTER TABLE "Preventivo" ADD CONSTRAINT "Preventivo_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
