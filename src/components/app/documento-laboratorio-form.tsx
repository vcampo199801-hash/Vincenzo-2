"use client";

import { useActionState } from "react";
import { uploadDocumentoLaboratorio, type UploadState } from "@/lib/actions/laboratori";
import { CATEGORIA_DOCUMENTO_LABORATORIO_OPTIONS } from "@/lib/laboratori";
import { FormError, SubmitButton } from "@/components/ui/form";

function StepBadge({ n }: { n: number }) {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
      {n}
    </span>
  );
}

export function DocumentoLaboratorioForm({ laboratorioId, disabled }: { laboratorioId: string; disabled: boolean }) {
  const uploadWithId = uploadDocumentoLaboratorio.bind(null, laboratorioId);
  const [state, formAction] = useActionState<UploadState, FormData>(uploadWithId, undefined);

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-slate-100 bg-slate-50 p-4">
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">Categoria</span>
        <select
          name="categoria"
          defaultValue="VISURA"
          disabled={disabled}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
        >
          {CATEGORIA_DOCUMENTO_LABORATORIO_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1 flex items-center gap-1.5 font-medium text-slate-700">
          <StepBadge n={1} /> Scegli il file
        </span>
        <input
          type="file"
          name="file"
          disabled={disabled}
          className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 disabled:opacity-50"
        />
      </label>
      <div>
        <span className="mb-1 flex items-center gap-1.5 text-sm font-medium text-slate-700">
          <StepBadge n={2} /> Carica il file scelto
        </span>
        <SubmitButton>Carica documento</SubmitButton>
      </div>
      {disabled && (
        <p className="text-xs text-slate-400">
          Nota per lo sviluppatore: imposta BLOB_READ_WRITE_TOKEN in .env per abilitare l&apos;archiviazione dei documenti.
        </p>
      )}
      <FormError error={state?.error} />
    </form>
  );
}
