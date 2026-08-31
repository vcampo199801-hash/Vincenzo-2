"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { inviaComunicazione, type Destinatari } from "@/lib/actions/admin-comunicazioni";
import { Field, TextAreaField, SubmitButton, FormError } from "@/components/ui/form";

const OPZIONI: { value: Destinatari; label: string }[] = [
  { value: "tutti", label: "Tutti gli studi registrati" },
  { value: "attivi", label: "Solo abbonati attivi" },
  { value: "prova", label: "Solo in prova gratuita" },
  { value: "scaduti", label: "Prova scaduta, non convertiti" },
  { value: "singolo", label: "Un singolo studio" },
];

export function ComunicazioneForm({
  conteggi,
  rinvia,
  studi,
}: {
  conteggi: Record<Destinatari, number>;
  rinvia?: { id: string; oggetto: string; messaggio: string; destinatari: Destinatari; studioId?: string } | null;
  studi: { id: string; name: string; email: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, formAction] = useActionState(inviaComunicazione, undefined);
  const [destinatari, setDestinatari] = useState<Destinatari>(rinvia?.destinatari ?? "tutti");
  const [studioId, setStudioId] = useState(rinvia?.studioId ?? "");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const studioSelezionato = studi.find((s) => s.id === studioId);
  const numeroDestinatari = conteggi[destinatari];
  const etichetta = OPZIONI.find((o) => o.value === destinatari)!.label;

  useEffect(() => {
    if (!state) return;
    setConfirmOpen(false);
    if ("success" in state) router.replace(pathname);
  }, [state, router, pathname]);

  // Il form non si rimonta cambiando pagina via link (stessa route, cambia
  // solo ?rinvia=...): oggetto/messaggio si aggiornano da soli grazie al
  // key sul <form> qui sotto, ma "destinatari"/"studioId" sono stato React e
  // vanno risincronizzati a mano ogni volta che cambia la comunicazione da rinviare.
  useEffect(() => {
    setDestinatari(rinvia?.destinatari ?? "tutti");
    setStudioId(rinvia?.studioId ?? "");
  }, [rinvia?.id, rinvia?.destinatari, rinvia?.studioId]);

  return (
    <form action={formAction} key={rinvia?.id ?? "nuova"} className="mt-6 space-y-4">
      {rinvia && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs text-brand-800">
          <span>Stai rinviando una comunicazione già mandata — puoi cambiare i destinatari prima di confermare.</span>
          <button
            type="button"
            onClick={() => router.replace(pathname)}
            className="shrink-0 font-medium underline hover:no-underline"
          >
            Annulla
          </button>
        </div>
      )}

      <label className="block min-w-0 text-sm">
        <span className="mb-1 block font-medium text-slate-700">Destinatari</span>
        <select
          name="destinatari"
          value={destinatari}
          onChange={(e) => setDestinatari(e.target.value as Destinatari)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {OPZIONI.map((o) => (
            <option key={o.value} value={o.value}>
              {o.value === "singolo" ? o.label : `${o.label} (${conteggi[o.value]})`}
            </option>
          ))}
        </select>
      </label>

      {destinatari === "singolo" && (
        <label className="block min-w-0 text-sm">
          <span className="mb-1 block font-medium text-slate-700">Studio</span>
          <select
            name="studioId"
            required
            value={studioId}
            onChange={(e) => setStudioId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="" disabled>
              Scegli uno studio…
            </option>
            {studi.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.email}
              </option>
            ))}
          </select>
        </label>
      )}

      <Field
        label="Oggetto"
        name="oggetto"
        required
        defaultValue={rinvia?.oggetto}
        placeholder="Es. Lo sapevi che puoi installare l'app sul telefono?"
      />

      <TextAreaField
        label="Messaggio"
        name="messaggio"
        rows={8}
        defaultValue={rinvia?.messaggio}
        placeholder="Scrivi qui il testo dell'email. Lascia una riga vuota per andare a capo con un nuovo paragrafo."
        hint="Verrà inviata con l'intestazione e il contatto WhatsApp usati per le altre email di Scadenze in Regola."
      />

      <FormError error={state && "error" in state ? state.error : undefined} />
      {state && "success" in state && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Inviata a {state.sent} studi{state.failed > 0 ? `, ${state.failed} falliti` : ""}.
        </p>
      )}

      <button
        type="button"
        disabled={destinatari === "singolo" && !studioId}
        onClick={() => setConfirmOpen(true)}
        className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
      >
        Invia
      </button>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg"
          >
            <p className="mb-4 text-sm text-slate-700">
              {destinatari === "singolo" ? (
                <>
                  Stai per inviare questa email a <strong>{studioSelezionato?.name ?? "questo studio"}</strong> (
                  {studioSelezionato?.email}).
                </>
              ) : (
                <>
                  Stai per inviare questa email a <strong>{numeroDestinatari} studi</strong> ({etichetta}).
                </>
              )}{" "}
              L&apos;invio non è annullabile una volta partito. Confermi?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Annulla
              </button>
              <SubmitButton>Conferma e invia</SubmitButton>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
