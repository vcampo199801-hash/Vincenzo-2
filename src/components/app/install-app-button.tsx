"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/** "Installa app" button: uses the native install prompt on Android/desktop
 * Chrome, and falls back to a step-by-step hint on iOS Safari, which has no
 * install-prompt API and requires the manual Condividi → Aggiungi a Home flow. */
export function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => setVisible(false);

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    if (isIos()) setVisible(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!visible) return null;

  const handleClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setVisible(false);
      return;
    }
    setShowIosHint((v) => !v);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        title="Installa app"
        className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100 sm:px-3"
      >
        <span aria-hidden>📲</span>
        <span className="hidden sm:inline">Installa app</span>
      </button>
      {showIosHint && (
        <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-lg">
          <p className="mb-2 font-medium text-slate-900">Aggiungi alla schermata Home</p>
          <ol className="list-decimal space-y-1 pl-4">
            <li>Tocca l&apos;icona di condivisione (il quadrato con la freccia in su) nel browser</li>
            <li>Scorri e scegli &quot;Aggiungi a Home&quot;</li>
            <li>Tocca &quot;Aggiungi&quot; in alto a destra</li>
          </ol>
          <button
            type="button"
            onClick={() => setShowIosHint(false)}
            className="mt-3 text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            Chiudi
          </button>
        </div>
      )}
    </div>
  );
}
