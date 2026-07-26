import type { ModuloTemplate } from "@/lib/modulistica-templates";

export function isModulisticaStorageConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export const STATO_MODULO_OPTIONS = [
  { value: "BOZZA", label: "Bozza" },
  { value: "FIRMATO", label: "Firmato" },
  { value: "INVIATO", label: "Inviato" },
];

export function optionLabel(options: { value: string; label: string }[], value: string) {
  return options.find((o) => o.value === value)?.label ?? value;
}

/** Tutti gli id di campo/checkbox di un template, per leggere genericamente il
 * FormData della compilazione senza dover scrivere un parser per ognuno dei 18. */
export function idCampiTemplate(template: ModuloTemplate): string[] {
  const ids: string[] = [];
  for (const sezione of template.sezioni) {
    for (const blocco of sezione.blocchi) {
      if (blocco.tipo === "campo") ids.push(blocco.campo.id);
      if (blocco.tipo === "checkbox") {
        for (const item of blocco.items) {
          ids.push(item.id);
          if (item.campoLibero) ids.push(item.campoLibero.id);
        }
      }
    }
  }
  return ids;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** Convenzione comune negli studi medici: data di nascita in formato GGMMAAAA,
 * con in coda un numero scelto dall'operatore al momento dell'invio — così la
 * password non è mai solo un dato facilmente indovinabile da terzi. */
export function costruisciPasswordPdf(dataNascita: Date | null, numeroScelto: string): string {
  const base = dataNascita ? `${pad2(dataNascita.getDate())}${pad2(dataNascita.getMonth() + 1)}${dataNascita.getFullYear()}` : "";
  return `${base}${numeroScelto}`.trim();
}
