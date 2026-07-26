"use client";

import { useActionState } from "react";
import type { ModuloTemplate } from "@/lib/modulistica-templates";
import { compilaModulo } from "@/lib/actions/modulistica";
import { Field, SubmitButton, FormError } from "@/components/ui/form";
import { SignaturePad } from "@/components/app/signature-pad";

export function ModuloCompilazioneForm({ pazienteId, template }: { pazienteId: string; template: ModuloTemplate }) {
  const action = compilaModulo.bind(null, pazienteId, template.key);
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-8">
      {template.sezioni.map((sezione, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-slate-900">{sezione.titolo}</h2>
          <div className="space-y-4 text-sm text-slate-700">
            {sezione.blocchi.map((b, j) => {
              if (b.tipo === "paragrafo") {
                return (
                  <p key={j} className="leading-relaxed text-slate-600">
                    {b.testo}
                  </p>
                );
              }
              if (b.tipo === "lista") {
                return (
                  <ul key={j} className="list-disc space-y-1 pl-5 text-slate-600">
                    {b.voci.map((v, k) => (
                      <li key={k}>{v}</li>
                    ))}
                  </ul>
                );
              }
              if (b.tipo === "checkbox") {
                return (
                  <div key={j} className="space-y-2">
                    {b.items.map((item) => (
                      <div key={item.id} className="flex flex-wrap items-center gap-2">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" name={item.id} className="h-4 w-4 rounded border-slate-300" />
                          <span>{item.label}</span>
                        </label>
                        {item.campoLibero && (
                          <input
                            type="text"
                            name={item.campoLibero.id}
                            placeholder={item.campoLibero.label}
                            className="w-48 rounded border border-slate-300 px-2 py-1 text-xs"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                );
              }
              return (
                <div key={j}>
                  {b.campo.multilinea ? (
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-slate-500">{b.campo.label}</span>
                      <textarea name={b.campo.id} rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                    </label>
                  ) : (
                    <Field label={b.campo.label} name={b.campo.id} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {template.tipoConsenso !== "nessuno" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-slate-900">Consenso</h2>

          {template.tipoConsenso === "binario" && (
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" name="consenso" value="ACCONSENTO" required />
                ACCONSENTO ad essere sottoposto/a al trattamento sopra descritto.
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="consenso" value="NON_ACCONSENTO" required />
                NON ACCONSENTO al trattamento proposto, essendo stato/a informato/a delle possibili conseguenze del rifiuto.
              </label>
            </div>
          )}

          {template.tipoConsenso === "pedodonzia" && (
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" name="consenso" value="ACCONSENTIAMO" required />
                ACCONSENTIAMO alle cure sopra indicate per il minore.
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="consenso" value="NON_ACCONSENTIAMO" required />
                NON ACCONSENTIAMO alle cure proposte, informati delle possibili conseguenze del rifiuto.
              </label>
            </div>
          )}

          {template.tipoConsenso === "multiplo" && template.consensoMultiploVoci && (
            <div className="space-y-3 text-sm">
              {template.consensoMultiploVoci.map((voce) => (
                <div key={voce.id}>
                  <p className="mb-1 text-slate-700">{voce.label}</p>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5">
                      <input type="radio" name={`consenso_${voce.id}`} value="PRESTO" required /> Presto il consenso
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input type="radio" name={`consenso_${voce.id}`} value="NEGO" required /> Nego il consenso
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {template.tipoConsenso === "dissenso" && (
            <Field label="Testimone, in caso di rifiuto di sottoscrizione (Cognome, Nome, qualifica)" name="testimoneNome" />
          )}
        </div>
      )}

      {template.richiedeDatiMinore && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-slate-900">Esercenti la responsabilità genitoriale / tutore</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Genitore 1 / Tutore (Cognome e Nome)" name="genitore1Nome" required />
            <Field label="Genitore 2 (Cognome e Nome)" name="genitore2Nome" />
          </div>
        </div>
      )}

      {template.richiedeMinorenne && !template.richiedeDatiMinore && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-slate-900">Se il paziente è minorenne o legalmente incapace</h2>
          <p className="mb-3 text-xs text-slate-500">Lascia vuoto se il paziente è un adulto capace di firmare da solo.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Genitore 1 / Tutore (Cognome e Nome)" name="genitore1Nome" />
            <Field label="Genitore 2 (Cognome e Nome)" name="genitore2Nome" />
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-slate-900">Luogo, data e firme</h2>
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <Field label="Luogo" name="luogo" />
          <Field label="Data" name="data" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {template.richiedeDatiMinore ? (
            <>
              <SignaturePad name="firmaGenitore1" label="Firma Genitore 1 / Tutore" />
              <SignaturePad name="firmaGenitore2" label="Firma Genitore 2 (se presente)" />
            </>
          ) : (
            <SignaturePad name="firmaPaziente" label="Firma del paziente (o di chi esercita la responsabilità genitoriale)" />
          )}
          <SignaturePad name="firmaOdontoiatra" label="Firma e timbro dell'odontoiatra" />
          {template.richiedeMinorenne && !template.richiedeDatiMinore && (
            <>
              <SignaturePad name="firmaGenitore1" label="Firma Genitore 1 / Tutore (se minorenne)" />
              <SignaturePad name="firmaGenitore2" label="Firma Genitore 2 (se minorenne)" />
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-base font-semibold text-slate-900">Protezione del PDF</h2>
        <p className="mb-3 text-xs text-slate-500">
          Il PDF verrà protetto da password: data di nascita del paziente (GGMMAAAA) più il numero che scegli qui, da
          comunicare al paziente separatamente. Lascia vuoto per non proteggere il file.
        </p>
        <Field label="Numero aggiuntivo per la password" name="passwordNumero" placeholder="Es. 42" />
      </div>

      <FormError error={state?.error} />
      <SubmitButton>Genera e firma il modulo</SubmitButton>
    </form>
  );
}
