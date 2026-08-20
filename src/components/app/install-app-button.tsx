"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isAndroid() {
  if (typeof navigator === "undefined") return false;
  return /android/i.test(navigator.userAgent);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/** "Installa app" button: usa il prompt nativo quando il browser lo offre
 * (beforeinstallprompt — Android Chrome, alcuni desktop Chrome/Edge), ma
 * NON dipende da quell'evento per essere visibile: Chrome decide da solo,
 * con logiche di "engagement" non prevedibili, se e quando spararlo, quindi
 * affidarsi solo a quello lo fa sparire per molti utenti senza motivo
 * apparente. Il bottone resta sempre visibile (finché non è già installata)
 * e mostra istruzioni manuali quando il prompt nativo non è disponibile. */
type Hint = "ios" | "android" | "desktop" | null;

export function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [hint, setHint] = useState<Hint>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (isStandalone()) {
      setVisible(false);
      return;
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setVisible(false);

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

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
      return;
    }
    setHint((h) => (h ? null : isIos() ? "ios" : isAndroid() ? "android" : "desktop"));
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        title="Installa app"
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-2.5 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700 sm:px-3"
      >
        <span aria-hidden>📲</span>
        <span className="hidden sm:inline">Installa app</span>
      </button>
      {hint === "ios" && (
        <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-lg">
          <p className="mb-2 font-medium text-slate-900">Aggiungi alla schermata Home</p>
          <ol className="list-decimal space-y-1 pl-4">
            <li>Tocca l&apos;icona di condivisione (il quadrato con la freccia in su) nel browser</li>
            <li>Scorri e scegli &quot;Aggiungi a Home&quot;</li>
            <li>Tocca &quot;Aggiungi&quot; in alto a destra</li>
          </ol>
          <button
            type="button"
            onClick={() => setHint(null)}
            className="mt-3 text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            Chiudi
          </button>
        </div>
      )}
      {hint === "android" && (
        <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-lg">
          <p className="mb-2 font-medium text-slate-900">Serve Google Chrome</p>
          <p>
            Per aggiungere l&apos;app alla schermata Home su Android bisogna aprire questo sito con{" "}
            <strong>Google Chrome</strong> — con altri browser (es. quello di Samsung) la voce
            &quot;Installa app&quot; non compare.
          </p>
          <p className="mt-2">
            Apri Chrome su questa pagina, poi tocca il pulsante <strong>Installa app</strong> qui sopra,
            oppure il menu <strong>⋮</strong> in alto e scegli &quot;Installa app&quot;.
          </p>
          <button
            type="button"
            onClick={() => setHint(null)}
            className="mt-3 text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            Chiudi
          </button>
        </div>
      )}
      {hint === "desktop" && (
        <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-lg">
          <p className="mb-2 font-medium text-slate-900">Installa sul computer</p>
          <p>
            Su <strong>Chrome</strong>: se compare, tocca l&apos;icona <strong>⊕</strong> nella barra degli indirizzi.
            Altrimenti apri il menu <strong>⋮</strong> in alto a destra, scorri fino a <strong>&quot;Salva&quot;</strong> e
            scegli <strong>&quot;Installa pagina come app...&quot;</strong>.
          </p>
          <p className="mt-2">Su <strong>Edge</strong> il percorso è simile, dal menu <strong>⋯</strong> in alto a destra.</p>
          <p className="mt-2">Su Safari da computer l&apos;installazione come app non è supportata.</p>
          <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
            Non ci riesci?{" "}
            <Link href="/app/guida" className="font-medium text-brand-700 hover:underline">
              Scrivici dalla pagina Guida e supporto
            </Link>
            , ti guidiamo noi passo passo.
          </p>
          <button
            type="button"
            onClick={() => setHint(null)}
            className="mt-3 text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            Chiudi
          </button>
        </div>
      )}
    </div>
  );
}
