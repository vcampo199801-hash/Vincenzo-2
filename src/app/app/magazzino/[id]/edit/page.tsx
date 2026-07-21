import { notFound } from "next/navigation";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { updateMagazzinoItem } from "@/lib/actions/magazzino";
import { PageHeader } from "@/components/ui/page-header";
import { Field, SelectField, TextAreaField, SubmitButton } from "@/components/ui/form";
import { MAGAZZINO_CATEGORIE } from "@/lib/compliance";
import { BarcodeScanner } from "@/components/app/barcode-scanner";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function EditMagazzinoPage({ params }: { params: Promise<{ id: string }> }) {
  const { studio } = await requireActiveSubscription();
  const { id } = await params;
  const item = await prisma.magazzinoItem.findFirst({ where: { id, studioId: studio.id } });
  if (!item) notFound();

  const updateWithId = updateMagazzinoItem.bind(null, item.id);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Modifica articolo" />
      <form action={updateWithId} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <BarcodeScanner targets={{ codice: "codice", scadenza: "scadenzaLotto" }} />
        <Field label="Prodotto" name="prodotto" required defaultValue={item.prodotto} />
        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Categoria" name="categoria" defaultValue={item.categoria} options={MAGAZZINO_CATEGORIE.map((c) => ({ value: c, label: c }))} />
          <Field label="Fornitore" name="fornitore" defaultValue={item.fornitore} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Unità" name="unita" defaultValue={item.unita} />
          <Field label="Scorta minima" name="scortaMinima" type="number" step="0.01" defaultValue={item.scortaMinima} />
          <Field label="Quantità attuale" name="quantitaAttuale" type="number" step="0.01" defaultValue={item.quantitaAttuale} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Scadenza lotto" name="scadenzaLotto" type="date" defaultValue={item.scadenzaLotto?.toISOString().slice(0, 10)} />
          <Field label="Prezzo unitario (€)" name="prezzoUnitario" type="number" step="0.01" defaultValue={item.prezzoUnitario} />
        </div>
        <Field label="Codice a barre / GTIN" name="codice" defaultValue={item.codice} />
        <TextAreaField label="Note" name="note" defaultValue={item.note} />
        <SubmitButton>Salva modifiche</SubmitButton>
      </form>
    </div>
  );
}
