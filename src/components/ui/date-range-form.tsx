"use client";

import { useRouter } from "next/navigation";

/** Form "Da — A" per un periodo personalizzato: invia via router.push invece
 * che con una submit nativa, così la pagina non risale in cima come farebbe
 * una normale navigazione GET — resta dove l'utente stava guardando. */
export function DateRangeForm({
  basePath,
  hiddenParams,
  daName,
  aName,
  daDefault,
  aDefault,
}: {
  basePath: string;
  hiddenParams: Record<string, string>;
  daName: string;
  aName: string;
  daDefault: string;
  aDefault: string;
}) {
  const router = useRouter();

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const params = new URLSearchParams(hiddenParams);
        params.set(daName, String(formData.get(daName) ?? daDefault));
        params.set(aName, String(formData.get(aName) ?? aDefault));
        router.push(`${basePath}?${params.toString()}`, { scroll: false });
      }}
    >
      <input type="date" name={daName} defaultValue={daDefault} className="rounded-lg border border-slate-300 px-2 py-1 text-sm" />
      <span className="text-sm text-slate-400">—</span>
      <input type="date" name={aName} defaultValue={aDefault} className="rounded-lg border border-slate-300 px-2 py-1 text-sm" />
      <button type="submit" className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200">
        Applica
      </button>
    </form>
  );
}
