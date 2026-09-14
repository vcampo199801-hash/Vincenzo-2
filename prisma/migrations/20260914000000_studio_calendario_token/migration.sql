-- AlterTable
ALTER TABLE "Studio" ADD COLUMN "calendarioToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Studio_calendarioToken_key" ON "Studio"("calendarioToken");
