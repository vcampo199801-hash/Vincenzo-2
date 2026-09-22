"use client";

import { useState } from "react";
import { Field, SelectField, TextAreaField, SubmitButton } from "@/components/ui/form";
import { TIPO_MOVIMENTO_OPTIONS, MODALITA_INCASSO_OPTIONS, type TipoMovimento } from "@/lib/cassa";

type Props = {
  action: (formData: FormData) => void;
  defaultValues?: {
    tipo?: string;
    data?: string;
    importo?: number | null;
    modalitaIncasso?: string | null;
    numeroFattura?: string | null;
    nominativo?: string | null;
    note?: string | null;
  };
  submitLabel?: string;
};

/** Un solo movimento può essere un incasso (contanti/assegno, con numero
 * fattura) oppure un prelievo/versamento (con nominativo) — i campi
 * cambiano in base al tipo scelto, per questo serve un componente client
 * invece del solito form server-rendered statico. */
export function MovimentoCassaForm({ action, defaultValues, submitLabel = "Salva movimento" }: Props) {
  const [tipo, setTipo] = useState<TipoMovimento>((defaultValues?.tipo as TipoMovimento) ?? "INCASSO");
  const isIncasso = tipo === "INCASSO";

  return (
    <form action={action} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block min-w-0 text-sm">
          <span className="mb-1 block font-medium text-slate-700">Tipo movimento</span>
          <select
            name="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoMovimento)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {TIPO_MOVIMENTO_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <Field label="Data" name="data" type="date" required defaultValue={defaultValues?.data} />
      </div>

      <Field label="Importo (€)" name="importo" type="number" step="0.01" required defaultValue={defaultValues?.importo ?? undefined} />

      {isIncasso ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            label="Modalità"
            name="modalitaIncasso"
            defaultValue={defaultValues?.modalitaIncasso ?? "CONTANTI"}
            options={[...MODALITA_INCASSO_OPTIONS]}
          />
          <Field label="Numero fattura" name="numeroFattura" defaultValue={defaultValues?.numeroFattura} hint="Facoltativo." />
        </div>
      ) : (
        <Field label="Nominativo" name="nominativo" defaultValue={defaultValues?.nominativo} hint="Facoltativo." />
      )}

      <TextAreaField label="Note" name="note" defaultValue={defaultValues?.note} />
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
