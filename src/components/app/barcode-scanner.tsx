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
 * Chrome on Android. */
export function BarcodeScanner({ targets }: { targets: ScannerTargets }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  const [lastScan, setLastScan] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    setCameraSupported(typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia);
  }, []);

  function fillForm(raw: string) {
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
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = e.currentTarget.value.trim();
      if (value) fillForm(value);
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
            fillForm(result.getText());
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
      <p className="mb-3 text-xs text-brand-700">
        Con un lettore esterno (USB o Bluetooth) collegato al telefono o al PC: clicca nel campo e scansiona,
        i dati si compilano da soli.
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
