// Campo testo con suggerimenti (datalist nativa, nessun JS): propone i
// fornitori già censiti in "Fornitori materiali di consumo", ma resta libero
// da compilare per un fornitore non ancora registrato.
export function FornitoreField({
  label = "Fornitore",
  name = "fornitore",
  defaultValue,
  opzioni,
}: {
  label?: string;
  name?: string;
  defaultValue?: string | null;
  opzioni: string[];
}) {
  const listId = `${name}-suggerimenti`;
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <input
        name={name}
        list={listId}
        defaultValue={defaultValue ?? ""}
        placeholder="Es. Depot Dentale"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      <datalist id={listId}>
        {opzioni.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
      {opzioni.length > 0 && (
        <span className="mt-1 block text-xs text-slate-400">Suggeriti dai fornitori di materiali di consumo già censiti.</span>
      )}
    </label>
  );
}
