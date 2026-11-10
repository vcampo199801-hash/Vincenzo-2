"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { confirmDocumentoFile } from "@/lib/actions/documenti";
import { FormError } from "@/components/ui/form";

/** Carica il file direttamente dal browser a Vercel Blob (non passa dal
 * corpo di una nostra Function): una Server Action classica è limitata dal
 * tetto di Vercel sulle Function (4.5 MB), troppo poco per una foto scattata
 * da telefono — con questo approccio quel limite non si applica. */
export function DocumentoUploadForm({ documentoId, disabled }: { documentoId: string; disabled: boolean }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState(0);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const blob = await upload(`documenti/${documentoId}/${Date.now()}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/documenti/upload",
        clientPayload: JSON.stringify({ documentoId }),
      });
      const result = await confirmDocumentoFile(documentoId, blob.url, file.name);
      if (result?.error) setError(result.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Caricamento non riuscito.");
    } finally {
      setUploading(false);
      setInputKey((k) => k + 1); // rimonta l'input per permettere di riselezionare lo stesso file dopo un errore
    }
  }

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">Scansione (PDF o foto)</span>
        <input
          key={inputKey}
          type="file"
          accept="application/pdf,image/*"
          disabled={disabled || uploading}
          onChange={handleFileChange}
          className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 disabled:opacity-50"
        />
      </label>
      {uploading && <p className="mt-2 text-xs text-slate-500">Caricamento in corso…</p>}
      {disabled && (
        <p className="mt-2 text-xs text-slate-400">
          Nota per lo sviluppatore: imposta BLOB_READ_WRITE_TOKEN in .env per abilitare l&apos;archiviazione dei documenti.
        </p>
      )}
      <div className="mt-2">
        <FormError error={error ?? undefined} />
      </div>
    </div>
  );
}
