-- CreateTable
CREATE TABLE "MagazzinoCodiceMemoria" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "codice" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "prodotto" TEXT NOT NULL,
    "fornitore" TEXT,
    "unita" TEXT NOT NULL,
    "scortaMinima" DOUBLE PRECISION NOT NULL,
    "prezzoUnitario" DOUBLE PRECISION NOT NULL,
    "aggiornatoIl" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MagazzinoCodiceMemoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmacoCodiceMemoria" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "codice" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoriaUso" TEXT,
    "doveSiTrova" TEXT,
    "aggiornatoIl" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmacoCodiceMemoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MagazzinoCodiceMemoria_studioId_idx" ON "MagazzinoCodiceMemoria"("studioId");

-- CreateIndex
CREATE UNIQUE INDEX "MagazzinoCodiceMemoria_studioId_codice_key" ON "MagazzinoCodiceMemoria"("studioId", "codice");

-- CreateIndex
CREATE INDEX "FarmacoCodiceMemoria_studioId_idx" ON "FarmacoCodiceMemoria"("studioId");

-- CreateIndex
CREATE UNIQUE INDEX "FarmacoCodiceMemoria_studioId_codice_key" ON "FarmacoCodiceMemoria"("studioId", "codice");

-- AddForeignKey
ALTER TABLE "MagazzinoCodiceMemoria" ADD CONSTRAINT "MagazzinoCodiceMemoria_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmacoCodiceMemoria" ADD CONSTRAINT "FarmacoCodiceMemoria_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

