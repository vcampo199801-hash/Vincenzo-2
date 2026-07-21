"use client";

import { useActionState } from "react";
import { importDipendentiCsv } from "@/lib/actions/personale";
import { FormError } from "@/components/ui/form";

export function ImportDipendentiCsvForm() {
  const [state, formAction] = useActionState(importDipendentiCsv, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <input
        type="file"
        name="file"
        accept=".csv,text/csv"
        required
        className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
      />
      <button
        type="submit"
        className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Importa CSV
      </button>
      {state?.error && <FormError error={state.error} />}
      {state?.success && <p className="text-sm text-emerald-700">{state.success}</p>}
    </form>
  );
}
