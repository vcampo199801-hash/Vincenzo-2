ALTER TABLE "Studio" ADD COLUMN "magazzinoInBilancio" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ManutenzioneLog" ADD COLUMN "costo" DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE TABLE "MovimentoMagazzino" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "magazzinoItemId" TEXT NOT NULL,
    "quantita" DOUBLE PRECISION NOT NULL,
    "costo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimentoMagazzino_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MovimentoMagazzino_studioId_idx" ON "MovimentoMagazzino"("studioId");
CREATE INDEX "MovimentoMagazzino_magazzinoItemId_idx" ON "MovimentoMagazzino"("magazzinoItemId");

ALTER TABLE "MovimentoMagazzino" ADD CONSTRAINT "MovimentoMagazzino_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MovimentoMagazzino" ADD CONSTRAINT "MovimentoMagazzino_magazzinoItemId_fkey" FOREIGN KEY ("magazzinoItemId") REFERENCES "MagazzinoItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
