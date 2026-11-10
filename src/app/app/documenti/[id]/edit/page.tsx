import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveSubscription } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/compliance";
import { updateDocumento, deleteDocumentoFile } from "@/lib/actions/documenti";
import { isDocumentiStorageConfigured } from "@/lib/documenti";
import { PageHeader } from "@/components/ui/page-header";
import { Field, SelectField, TextAreaField, SubmitButton } from "@/components/ui/form";
import { DeleteButton } from "@/components/ui/delete-button";
import { DocumentoUploadForm } from "@/components/app/documento-upload-form";
import { UnsavedChangesGuard } from "@/components/app/unsaved-changes-guard";

// Session-dependent, must never be prerendered or cached.
export const dynamic = "force-dynamic";

export default async function EditDocumentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { studio } = await requireActiveSubscription("documenti");
  const { id } = await params;
  const item = await prisma.documento.findFirst({ where: { id, studioId: studio.id } });
  if (!item) notFound();

  const updateWithId = updateDocumento.bind(null, item.id);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Modifica documento" />
      <UnsavedChangesGuard>
      <form action={updateWithId} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Field label="Documento" name="nome" required defaultValue={item.nome} />
        <SelectField
          label="Stato"
          name="stato"
          defaultValue={item.stato}
          options={[
            { value: "PRESENTE", label: "Presente" },
            { value: "DA_AGGIORNARE", label: "Da aggiornare" },
            { value: "MANCANTE", label: "Mancante" },
          ]}
        />
        <TextAreaField label="Note / dove si trova" name="note" defaultValue={item.note} />
        <SubmitButton>Salva modifiche</SubmitButton>
      </form>
      </UnsavedChangesGuard>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-base font-semibold text-slate-900">Scansione del documento</h2>
        <p className="mb-4 text-sm text-slate-500">
          Facoltativa: la checklist resta valida anche solo con lo stato qui sopra. Un nuovo caricamento sostituisce
          quello precedente.
        </p>

        {item.fileUrl ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm">
            <Link
              href={`/app/documenti/documento/${item.id}`}
              className="min-w-0 flex-1 truncate font-medium text-brand-600 hover:text-brand-800"
            >
              📄 {item.nomeFile}
            </Link>
            <div className="flex shrink-0 items-center gap-3">
              {item.dataCaricamento && <span className="text-xs text-slate-400">Caricato il {formatDate(item.dataCaricamento)}</span>}
              <DeleteButton action={deleteDocumentoFile.bind(null, item.id)} />
            </div>
          </div>
        ) : (
          <DocumentoUploadForm documentoId={item.id} disabled={!isDocumentiStorageConfigured()} />
        )}
      </div>
    </div>
  );
}
