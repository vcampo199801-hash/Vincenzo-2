-- Dati di fatturazione dell'abbonamento, per la pagina admin di monitoraggio incassi.
ALTER TABLE "Studio" ADD COLUMN "partitaIva" TEXT;
ALTER TABLE "Studio" ADD COLUMN "pec" TEXT;
