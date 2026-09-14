// Calcolo condiviso prezzo con IVA, usato ovunque un modulo registra un
// importo d'acquisto (Fornitori, Magazzino, Spese, Laboratori, Manutenzione).
// L'importo con IVA non va mai salvato a parte: si calcola sempre da importo
// (senza IVA) + percentuale, altrimenti i due valori possono disallinearsi
// se uno dei due viene corretto in un secondo momento.

export const IVA_PERCENTUALE_DEFAULT = 22;

export function importoConIva(importo: number | null | undefined, percentualeIva: number | null | undefined) {
  if (importo === null || importo === undefined) return null;
  return importo * (1 + (percentualeIva ?? 0) / 100);
}
