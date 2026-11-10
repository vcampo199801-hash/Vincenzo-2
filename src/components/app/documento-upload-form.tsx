"use client";

import { useActionState } from "react";
import { uploadDocumentoFile, type UploadDocumentoFileState } from "@/lib/actions/documenti";
import { FormError, SubmitButton } from "@/components/ui/form";

export function DocumentoUploadForm({ documentoId, disabled }: { documentoId: string; disabled: boolean }) {
  const uploadWithId = uploadDocumentoFile.bind(null, documentoId);
  const [state, formAction] = useActionState<UploadDocumentoFileState, FormData>(uploadWithId, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4">
      <label className="block min-w-0 flex-1 text-sm">
        <span className="mb-1 block font-medium text-slate-700">Scansione (PDF o foto)</span>
        <input
          type="file"
          name="file"
          accept="application/pdf,image/*"
          disabled={disabled}
          className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 disabled:opacity-50"
        />
      </label>
      <SubmitButton>Carica</SubmitButton>
      {disabled && (
        <p className="w-full text-xs text-slate-400">
          Nota per lo sviluppatore: imposta BLOB_READ_WRITE_TOKEN in .env per abilitare l&apos;archiviazione dei documenti.
        </p>
      )}
      <div className="w-full">
        <FormError error={state?.error} />
      </div>
    </form>
  );
}
