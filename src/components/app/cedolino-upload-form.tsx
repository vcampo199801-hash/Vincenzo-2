"use client";

import { useActionState } from "react";
import { uploadCedolino, type UploadCedolinoState } from "@/lib/actions/personale";
import { MESI_LABELS_BREVI } from "@/lib/personale";
import { FormError, SubmitButton } from "@/components/ui/form";

export function CedolinoUploadForm({ dipendenteId, disabled }: { dipendenteId: string; disabled: boolean }) {
  const uploadWithId = uploadCedolino.bind(null, dipendenteId);
  const [state, formAction] = useActionState<UploadCedolinoState, FormData>(uploadWithId, undefined);
  const annoCorrente = new Date().getFullYear();

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4">
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">Mese</span>
        <select
          name="mese"
          defaultValue={new Date().getMonth() + 1}
          disabled={disabled}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
        >
          {MESI_LABELS_BREVI.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">Anno</span>
        <input
          name="anno"
          type="number"
          defaultValue={annoCorrente}
          disabled={disabled}
          className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">File PDF</span>
        <input
          type="file"
          name="file"
          accept="application/pdf"
          disabled={disabled}
          className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 disabled:opacity-50"
        />
      </label>
      <SubmitButton>Carica cedolino</SubmitButton>
      {disabled && (
        <p className="w-full text-xs text-slate-400">
          Nota per lo sviluppatore: imposta BLOB_READ_WRITE_TOKEN in .env per abilitare l&apos;archiviazione dei cedolini.
        </p>
      )}
      <div className="w-full">
        <FormError error={state?.error} />
      </div>
    </form>
  );
}
