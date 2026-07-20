"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
    >
      Stampa / Esporta PDF
    </button>
  );
}
