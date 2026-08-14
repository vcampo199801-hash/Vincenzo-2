-- Il forum resta solo confronto tra colleghi: rimossa la categoria
-- compravendita e il relativo campo prezzo.
ALTER TABLE "ForumPost" DROP COLUMN "prezzo";
