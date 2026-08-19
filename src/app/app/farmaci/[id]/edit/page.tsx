import { notFound } from "next/navigation";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { updateFarmaco } from "@/lib/actions/farmaci";
import { PageHeader } from "@/components/ui/page-header";
import { Field, TextAreaField, CheckboxField, SubmitButton } from "@/components/ui/form";
import { FornitoreField } from "@/components/ui/fornitore-field";
import { BarcodeScanner } from "@/components/app/barcode-scanner";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function EditFarmacoPage({ params }: { params: Promise<{ id: string }> }) {
  const { studio } = await requireActiveSubscription("farmaci");
  const { id } = await params;
  const [item, fornitoriMateriali] = await Promise.all([
    prisma.farmaco.findFirst({ where: { id, studioId: studio.id } }),
    prisma.fornitore.findMany({ where: { studioId: studio.id, tipo: "MATERIALI", nome: { not: null } }, orderBy: { nome: "asc" } }),
  ]);
  if (!item) notFound();
  const opzioniFornitore = [...new Set(fornitoriMateriali.map((f) => f.nome!).filter(Boolean))];

  const updateWithId = updateFarmaco.bind(null, item.id);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Modifica farmaco / presidio" />
      <form action={updateWithId} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <BarcodeScanner targets={{ codice: "codice", lotto: "lotto", scadenza: "scadenza" }} />
        <Field label="Farmaco / Presidio" name="nome" required defaultValue={item.nome} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Categoria d'uso" name="categoriaUso" defaultValue={item.categoriaUso} />
          <Field label="Dove si trova" name="doveSiTrova" defaultValue={item.doveSiTrova} />
        </div>
        <FornitoreField defaultValue={item.fornitore} opzioni={opzioniFornitore} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Quantità" name="quantita" type="number" defaultValue={item.quantita} />
          <Field label="Lotto" name="lotto" defaultValue={item.lotto} />
          <Field label="Scadenza" name="scadenza" type="date" defaultValue={item.scadenza?.toISOString().slice(0, 10)} />
        </div>
        <Field label="Codice a barre / GTIN" name="codice" defaultValue={item.codice} />
        <TextAreaField label="Note" name="note" defaultValue={item.note} />
        <CheckboxField
          label="Silenzia i promemoria email per questo farmaco/presidio"
          name="notificaSilenziata"
          defaultChecked={item.notificaSilenziata}
        />
        <SubmitButton>Salva modifiche</SubmitButton>
      </form>
    </div>
  );
}
