import { Field } from "./form";
import { importoConIva, IVA_PERCENTUALE_DEFAULT } from "@/lib/iva";
import { formatCurrency } from "@/lib/compliance";

/** Coppia di campi "importo senza IVA" + "percentuale IVA", con il calcolo
 * dell'importo con IVA mostrato come suggerimento sotto il primo campo (mai
 * salvato a parte). Riusata in ogni modulo che registra un costo/acquisto:
 * Fornitori, Magazzino, Spese, Laboratori, Manutenzione. */
export function PrezzoIvaFields({
  labelImporto = "Importo (senza IVA) €",
  nameImporto = "importo",
  namePercentuale = "percentualeIva",
  importo,
  percentualeIva,
  required,
  hintVuoto = "Facoltativo.",
}: {
  labelImporto?: string;
  nameImporto?: string;
  namePercentuale?: string;
  importo?: number | null;
  percentualeIva?: number | null;
  required?: boolean;
  hintVuoto?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field
        label={labelImporto}
        name={nameImporto}
        type="number"
        step="0.01"
        required={required}
        defaultValue={importo ?? undefined}
        hint={importo !== null && importo !== undefined ? `Con IVA: ${formatCurrency(importoConIva(importo, percentualeIva) ?? 0)}` : hintVuoto}
      />
      <Field
        label="IVA (%)"
        name={namePercentuale}
        type="number"
        step="0.01"
        defaultValue={percentualeIva ?? IVA_PERCENTUALE_DEFAULT}
      />
    </div>
  );
}
