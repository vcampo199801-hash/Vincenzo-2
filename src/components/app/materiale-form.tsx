"use client";

import { useActionState } from "react";
import type { ComunicazioneFormState } from "@/lib/actions/comunicazione";
import { CATEGORIA_MATERIALE_OPTIONS } from "@/lib/comunicazione";
import { Field, TextAreaField, SelectField, SubmitButton, FormError } from "@/components/ui/form";

type Action = (prevState: ComunicazioneFormState, formData: FormData) => Promise<ComunicazioneFormState>;

export function MaterialeForm({
  action,
  defaultValues,
  immagineAttuale,
}: {
  action: Action;
  defaultValues?: { categoria: string; titolo: string; descrizione: string | null; videoUrl: string | null };
  immagineAttuale?: string | null;
}) {
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <SelectField label="Trattamento" name="categoria" options={CATEGORIA_MATERIALE_OPTIONS} defaultValue={defaultValues?.categoria ?? "ALTRO"} required />
      <Field label="Titolo" name="titolo" required defaultValue={defaultValues?.titolo} placeholder="Es. Come funziona un impianto dentale" />
      <TextAreaField
        label="Spiegazione in linguaggio semplice per il paziente"
        name="descrizione"
        defaultValue={defaultValues?.descrizione}
        placeholder="Poche frasi semplici, senza tecnicismi: cosa succede, quanto dura, cosa aspettarsi."
      />
      <Field
        label="Link video (YouTube o Vimeo)"
        name="videoUrl"
        defaultValue={defaultValues?.videoUrl}
        placeholder="https://www.youtube.com/watch?v=..."
        hint="Facoltativo. Va bene un video animato/esplicativo trovato online o acquistato, non serve produrlo da soli."
      />
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">Immagine esplicativa</span>
        {immagineAttuale && (
          // eslint-disable-next-line @next/next/no-img-element -- anteprima di un'immagine caricata su Blob, non un asset locale ottimizzabile
          <img src={immagineAttuale} alt="" className="mb-2 h-24 rounded-lg border border-slate-200 object-cover" />
        )}
        <input
          type="file"
          name="immagine"
          accept="image/*"
          className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
        />
        <span className="mt-1 block text-xs text-slate-400">Facoltativa. Es. una foto prima/dopo, uno schema, una radiografia esplicativa.</span>
      </label>
      <FormError error={state?.error} />
      <SubmitButton>Salva</SubmitButton>
    </form>
  );
}
