import { requireActiveSubscription } from "@/lib/auth-guards";
import { createMagazzinoItem } from "@/lib/actions/magazzino";
import { PageHeader } from "@/components/ui/page-header";
import { Field, SelectField, TextAreaField, SubmitButton } from "@/components/ui/form";
import { MAGAZZINO_CATEGORIE } from "@/lib/compliance";
import { BarcodeScanner } from "@/components/app/barcode-scanner";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function NewMagazzinoPage() {
  await requireActiveSubscription("magazzino");

  return (
    <div className="max-w-2xl">
      <PageHeader title="Aggiungi articolo di magazzino" />
      <form action={createMagazzinoItem} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <BarcodeScanner targets={{ codice: "codice", scadenza: "scadenzaLotto" }} />
        <Field label="Prodotto" name="prodotto" required placeholder="Es. Guanti nitrile taglia M" />
        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Categoria" name="categoria" defaultValue="Altro" options={MAGAZZINO_CATEGORIE.map((c) => ({ value: c, label: c }))} />
          <Field label="Fornitore" name="fornitore" placeholder="Es. Depot Dentale" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Unità" name="unita" defaultValue="pz" />
          <Field label="Scorta minima" name="scortaMinima" type="number" step="0.01" defaultValue={0} />
          <Field label="Quantità attuale" name="quantitaAttuale" type="number" step="0.01" defaultValue={0} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Scadenza lotto" name="scadenzaLotto" type="date" />
          <Field label="Prezzo unitario (€)" name="prezzoUnitario" type="number" step="0.01" defaultValue={0} />
        </div>
        <Field label="Codice a barre / GTIN" name="codice" placeholder="Compilato automaticamente dalla scansione" />
        <TextAreaField label="Note" name="note" />
        <SubmitButton>Salva articolo</SubmitButton>
      </form>
    </div>
  );
}
