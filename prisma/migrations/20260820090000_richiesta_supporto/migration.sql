CREATE TABLE "RichiestaSupporto" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "daEmail" TEXT NOT NULL,
    "messaggio" TEXT NOT NULL,
    "risolta" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RichiestaSupporto_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RichiestaSupporto_studioId_idx" ON "RichiestaSupporto"("studioId");

ALTER TABLE "RichiestaSupporto" ADD CONSTRAINT "RichiestaSupporto_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
