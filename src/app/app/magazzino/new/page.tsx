import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { createMagazzinoItem, cercaArticoloPerCodice } from "@/lib/actions/magazzino";
import { PageHeader } from "@/components/ui/page-header";
import { Field, SelectField, TextAreaField, SubmitButton } from "@/components/ui/form";
import { FornitoreField } from "@/components/ui/fornitore-field";
import { MAGAZZINO_CATEGORIE } from "@/lib/compliance";
import { BarcodeScanner } from "@/components/app/barcode-scanner";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function NewMagazzinoPage() {
  const { studio } = await requireActiveSubscription("magazzino");

  const fornitoriMateriali = await prisma.fornitore.findMany({
    where: { studioId: studio.id, tipo: "MATERIALI", nome: { not: null } },
    orderBy: { nome: "asc" },
  });
  const opzioniFornitore = [...new Set(fornitoriMateriali.map((f) => f.nome!).filter(Boolean))];

  return (
    <div className="max-w-2xl">
      <PageHeader title="Aggiungi articolo di magazzino" />
      <form action={createMagazzinoItem} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <BarcodeScanner targets={{ codice: "codice", scadenza: "scadenzaLotto" }} cerca={cercaArticoloPerCodice} />
        <Field label="Prodotto" name="prodotto" required placeholder="Es. Guanti nitrile taglia M" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField label="Categoria" name="categoria" defaultValue="Altro" options={MAGAZZINO_CATEGORIE.map((c) => ({ value: c, label: c }))} />
          <FornitoreField opzioni={opzioniFornitore} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Unità" name="unita" defaultValue="pz" />
          <Field label="Scorta minima" name="scortaMinima" type="number" step="0.01" defaultValue={0} />
          <Field label="Quantità attuale" name="quantitaAttuale" type="number" step="0.01" defaultValue={0} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
