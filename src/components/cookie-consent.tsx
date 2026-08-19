"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "sir_cookie_consent";
const CONSENT_EVENT = "sir-cookie-consent-changed";

export type ConsentValue = "granted" | "denied";

export function getStoredConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === "granted" || value === "denied" ? value : null;
}

function setStoredConsent(value: ConsentValue) {
  window.localStorage.setItem(STORAGE_KEY, value);
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
}

/** Reopens the banner from anywhere (e.g. a "Gestisci cookie" link in the footer). */
export function openCookieSettings() {
  window.dispatchEvent(new CustomEvent("sir-cookie-settings-open"));
}

export function useCookieConsent(): ConsentValue | null {
  const [consent, setConsent] = useState<ConsentValue | null>(null);

  useEffect(() => {
    setConsent(getStoredConsent());
    const onChange = (e: Event) => setConsent((e as CustomEvent<ConsentValue>).detail);
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  return consent;
}

/** Banner GDPR: nessun cookie non necessario (es. Meta Pixel) parte finché l'utente
 * non clicca "Accetta" — MetaPixel legge lo stesso consenso da localStorage. */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getStoredConsent() === null) setVisible(true);
    const onOpen = () => setVisible(true);
    window.addEventListener("sir-cookie-settings-open", onOpen);
    return () => window.removeEventListener("sir-cookie-settings-open", onOpen);
  }, []);

  if (!visible) return null;

  const choose = (value: ConsentValue) => {
    setStoredConsent(value);
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white px-4 py-4 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] sm:px-6">
      <div className="mx-auto flex max-w-4xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          Usiamo cookie tecnici necessari al funzionamento del sito e, solo se acconsenti, cookie di misurazione
          pubblicitaria (es. Meta/Facebook) per capire l&apos;efficacia delle nostre campagne. Dettagli nella{" "}
          <a href="/privacy" className="underline hover:text-slate-800">Privacy Policy</a>.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => choose("denied")}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Rifiuta
          </button>
          <button
            type="button"
            onClick={() => choose("granted")}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Accetta
          </button>
        </div>
      </div>
    </div>
  );
}
