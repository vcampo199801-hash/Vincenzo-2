"use client";

import { useEffect, useRef, useState } from "react";
import { parseGs1Barcode } from "@/lib/barcode";
import type { DecodeHintType as DecodeHintTypeT } from "@zxing/library";

/** Which form field (by `name`) each parsed piece of data should fill —
 * lets the same scanner drive Farmaci ("scadenza") and Magazzino ("scadenzaLotto"). */
export type ScannerTargets = {
  codice?: string;
  lotto?: string;
  scadenza?: string;
};

/** Scan support for the "external device" a studio plugs in — any USB/Bluetooth
 * barcode scanner acts as a keyboard, so the text input below is all that's
 * needed to capture it. The camera button decodes frames with ZXing (pure JS,
 * canvas-based) instead of the native BarcodeDetector API, which Safari/iOS
 * never implemented — this way the camera works on every phone, not just
 * Chrome on Android.
 *
 * If `cerca` is passed, a scan also looks up whether this exact barcode was
 * already saved on a previous item — a reorder of the same product — and, if
 * found, fills in the rest of the form (name, category, supplier...) too.
 * Without this, scanning would only ever save typing on the GTIN/lot/expiry
 * fields, which is why the camera felt pointless on a brand-new item: the
 * value shows up starting from the second time you stock the same product. */
export function BarcodeScanner({
  targets,
  cerca,
}: {
  targets: ScannerTargets;
  cerca?: (codice: string) => Promise<Record<string, string> | null>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  const [lastScan, setLastScan] = useState<string | null>(null);
  const [trovato, setTrovato] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    setCameraSupported(typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia);
  }, []);

  async function fillForm(raw: string) {
    const parsed = parseGs1Barcode(raw);
    const form = inputRef.current?.closest("form");
    if (form) {
      if (targets.codice) {
        const el = form.querySelector<HTMLInputElement>(`[name="${targets.codice}"]`);
        if (el) el.value = parsed.gtin ?? raw;
      }
      if (targets.lotto && parsed.lotto) {
        const el = form.querySelector<HTMLInputElement>(`[name="${targets.lotto}"]`);
        if (el) el.value = parsed.lotto;
      }
      if (targets.scadenza && parsed.scadenza) {
        const el = form.querySelector<HTMLInputElement>(`[name="${targets.scadenza}"]`);
        if (el) el.value = parsed.scadenza;
      }
    }
    const parts = [raw];
    if (parsed.lotto) parts.push(`lotto ${parsed.lotto}`);
    if (parsed.scadenza) parts.push(`scadenza ${parsed.scadenza}`);
    setLastScan(parts.join(" · "));
    setTrovato(null);

    if (cerca && form) {
      try {
        const trovatoDati = await cerca(parsed.gtin ?? raw);
        if (trovatoDati) {
          for (const [nome, valore] of Object.entries(trovatoDati)) {
            const el = form.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${nome}"]`);
            if (el && valore) el.value = valore;
          }
          setTrovato(trovatoDati.prodotto ?? trovatoDati.nome ?? "articolo già censito");
        }
      } catch {
        // La ricerca è solo un bonus di comodità: se fallisce si compila a mano.
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = e.currentTarget.value.trim();
      if (value) void fillForm(value);
      e.currentTarget.value = "";
    }
  }

  function stopCamera() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setCameraOpen(false);
  }

  async function startCamera() {
    setCameraError(null);
    setCameraOpen(true);
    try {
      const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType, NotFoundException }] = await Promise.all([
        import("@zxing/browser"),
        import("@zxing/library"),
      ]);
      const hints = new Map<DecodeHintTypeT, unknown>();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.QR_CODE,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.DATA_MATRIX,
      ]);
      const reader = new BrowserMultiFormatReader(hints);

      if (!videoRef.current) return;
      const controls = await reader.decodeFromConstraints(
        { video: { facingMode: "environment" } },
        videoRef.current,
        (result, error) => {
          if (result) {
            void fillForm(result.getText());
            stopCamera();
          } else if (error && !(error instanceof NotFoundException)) {
            // NotFoundException fires on every frame with no code in view —
            // normal mid-stream, not worth surfacing. Anything else is real.
          }
        }
      );
      controlsRef.current = controls;
    } catch {
      setCameraError("Impossibile accedere alla fotocamera: controlla i permessi del browser.");
      stopCamera();
    }
  }

  useEffect(() => () => stopCamera(), []);

  return (
    <div className="mb-4 rounded-xl border border-brand-200 bg-brand-50 p-4">
      <p className="mb-1 text-sm font-medium text-brand-800">Scansiona codice a barre / QR / DataMatrix</p>
      <p className="mb-1.5 text-xs text-brand-700">
        Con un lettore esterno (USB o Bluetooth) collegato al telefono o al PC: clicca nel campo e scansiona,
        i dati si compilano da soli.
      </p>
      <p className="mb-3 text-xs text-brand-700/80">
        La scansione conviene soprattutto sui riordini: se il codice è già stato censito una volta, i campi
        come nome, categoria e fornitore si compilano da soli e resta da inserire solo la scadenza del nuovo
        lotto. Non è comunque obbligatoria: puoi sempre compilare la scheda a mano.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          onKeyDown={handleKeyDown}
          placeholder="Clicca qui e scansiona con il lettore…"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        {cameraSupported && (
          <button
            type="button"
            onClick={startCamera}
            className="shrink-0 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Usa la fotocamera
          </button>
        )}
      </div>
      {!cameraSupported && (
        <p className="mt-2 text-xs text-brand-700">
          Questo browser non consente l&apos;accesso alla fotocamera: usa un lettore esterno oppure inserisci i
          dati a mano.
        </p>
      )}
      {cameraError && <p className="mt-2 text-xs text-red-700">{cameraError}</p>}
      {lastScan && <p className="mt-2 text-xs text-emerald-700">✓ Acquisito: {lastScan}</p>}
      {trovato && (
        <p className="mt-1 text-xs font-medium text-emerald-800">
          ✓ Già censito come &laquo;{trovato}&raquo;: gli altri campi sono stati precompilati, controllali prima di salvare.
        </p>
      )}

      {cameraOpen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-4">
          <video ref={videoRef} className="max-h-[70vh] w-full max-w-md rounded-lg" muted playsInline />
          <p className="mt-3 text-sm text-white">Inquadra il codice…</p>
          <button
            type="button"
            onClick={stopCamera}
            className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900"
          >
            Annulla
          </button>
        </div>
      )}
    </div>
  );
}
