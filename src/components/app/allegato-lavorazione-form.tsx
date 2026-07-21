"use client";

import { useActionState } from "react";
import { uploadAllegatoLavorazione, type UploadState } from "@/lib/actions/laboratori";
import { CATEGORIA_ALLEGATO_LAVORAZIONE_OPTIONS } from "@/lib/laboratori";
import { FormError, SubmitButton } from "@/components/ui/form";

export function AllegatoLavorazioneForm({ lavorazioneId, disabled }: { lavorazioneId: string; disabled: boolean }) {
  const uploadWithId = uploadAllegatoLavorazione.bind(null, lavorazioneId);
  const [state, formAction] = useActionState<UploadState, FormData>(uploadWithId, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4">
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">Categoria</span>
        <select
          name="categoria"
          defaultValue="DDT"
          disabled={disabled}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
        >
          {CATEGORIA_ALLEGATO_LAVORAZIONE_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">File</span>
        <input
          type="file"
          name="file"
          disabled={disabled}
          className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 disabled:opacity-50"
        />
      </label>
      <SubmitButton>Carica allegato</SubmitButton>
      <div className="w-full">
        <FormError error={state?.error} />
      </div>
    </form>
  );
}
