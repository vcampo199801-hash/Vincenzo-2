-- CreateTable
CREATE TABLE "TipoManutenzione" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "chiave" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cadenzaGiorni" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TipoManutenzione_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TipoManutenzione_studioId_idx" ON "TipoManutenzione"("studioId");

-- CreateIndex
CREATE UNIQUE INDEX "TipoManutenzione_studioId_chiave_key" ON "TipoManutenzione"("studioId", "chiave");

-- AddForeignKey
ALTER TABLE "TipoManutenzione" ADD CONSTRAINT "TipoManutenzione_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

