-- CreateTable
CREATE TABLE "MaterialeInformativo" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'ALTRO',
    "titolo" TEXT NOT NULL,
    "descrizione" TEXT,
    "immagineUrl" TEXT,
    "videoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialeInformativo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MaterialeInformativo_studioId_idx" ON "MaterialeInformativo"("studioId");

-- AddForeignKey
ALTER TABLE "MaterialeInformativo" ADD CONSTRAINT "MaterialeInformativo_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

