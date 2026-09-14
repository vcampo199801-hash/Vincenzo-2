-- AlterTable: la sezione Fornitori non gestisce più importo/IVA (spostati
-- solo su Magazzino, Spese, Laboratori, Manutenzione, dove hanno senso).
ALTER TABLE "Fornitore" DROP COLUMN "importo";
ALTER TABLE "Fornitore" DROP COLUMN "percentualeIva";
