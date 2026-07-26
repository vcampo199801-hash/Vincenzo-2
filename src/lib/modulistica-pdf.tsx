import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { ModuloTemplate, Blocco } from "@/lib/modulistica-templates";
import { formatDate } from "@/lib/compliance";

const styles = StyleSheet.create({
  page: { padding: 42, fontSize: 9.5, color: "#1e293b", lineHeight: 1.4 },
  headerBox: { borderBottom: 1, borderBottomColor: "#cbd5e1", paddingBottom: 8, marginBottom: 12 },
  headerLabel: { fontSize: 8, color: "#64748b" },
  headerValue: { fontSize: 9.5, marginBottom: 2 },
  title: { fontSize: 14, fontWeight: 700, marginBottom: 3 },
  sottotitolo: { fontSize: 8.5, color: "#475569", marginBottom: 10 },
  pazienteBox: { backgroundColor: "#f8fafc", padding: 8, marginBottom: 12, borderRadius: 2 },
  pazienteRow: { flexDirection: "row", marginBottom: 2 },
  pazienteLabel: { width: 130, fontSize: 8.5, color: "#64748b" },
  pazienteValue: { fontSize: 9.5, flex: 1 },
  sezioneTitolo: { fontSize: 10.5, fontWeight: 700, marginTop: 10, marginBottom: 4 },
  paragrafo: { marginBottom: 5, textAlign: "justify" },
  listaVoce: { flexDirection: "row", marginBottom: 3 },
  bullet: { width: 10 },
  listaTesto: { flex: 1, textAlign: "justify" },
  checkboxRiga: { flexDirection: "row", marginBottom: 3 },
  checkboxSimbolo: { width: 22, fontSize: 9 },
  checkboxTesto: { flex: 1 },
  campoRiga: { marginBottom: 5 },
  campoLabel: { fontSize: 8.5, color: "#64748b" },
  campoValore: { fontSize: 9.5 },
  firmaRiga: { flexDirection: "row", justifyContent: "space-between", marginTop: 18 },
  firmaBox: { width: "45%" },
  firmaLabel: { fontSize: 8.5, color: "#64748b", marginBottom: 2 },
  firmaImg: { width: 140, height: 45, objectFit: "contain" },
  firmaLinea: { borderTop: 1, borderTopColor: "#94a3b8", width: 160, marginTop: 2 },
  pageNumber: { position: "absolute", bottom: 20, right: 42, fontSize: 8, color: "#94a3b8" },
});

export type ModuloPdfInput = {
  studio: {
    name: string;
    indirizzo: string | null;
    citta: string | null;
    telefono: string | null;
    email: string | null;
    titolare: string | null;
    numeroAlboTitolare: string | null;
  };
  paziente: {
    nome: string;
    cognome: string;
    dataNascita: Date | null;
    luogoNascita: string | null;
    residenza: string | null;
    codiceFiscale: string | null;
    telefono: string | null;
    email: string | null;
    medicoCurante?: string | null;
    professione?: string | null;
  };
  template: ModuloTemplate;
  dati: Record<string, string>;
  consenso?: string;
  consensoMultiplo?: Record<string, "PRESTO" | "NEGO">;
  luogo?: string | null;
  data?: Date | null;
  genitore1Nome?: string;
  genitore2Nome?: string;
  testimoneNome?: string;
  firmaPazienteDataUrl?: string | null;
  firmaGenitore1DataUrl?: string | null;
  firmaGenitore2DataUrl?: string | null;
  firmaOdontoiatraDataUrl?: string | null;
};

function Blocchi({ blocchi, dati }: { blocchi: Blocco[]; dati: Record<string, string> }) {
  return (
    <>
      {blocchi.map((b, i) => {
        if (b.tipo === "paragrafo") {
          return (
            <Text key={i} style={styles.paragrafo}>
              {b.testo}
            </Text>
          );
        }
        if (b.tipo === "lista") {
          return (
            <View key={i} style={{ marginBottom: 5 }}>
              {b.voci.map((v, j) => (
                <View key={j} style={styles.listaVoce}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.listaTesto}>{v}</Text>
                </View>
              ))}
            </View>
          );
        }
        if (b.tipo === "checkbox") {
          return (
            <View key={i} style={{ marginBottom: 5 }}>
              {b.items.map((item) => {
                const checked = dati[item.id] === "true";
                const extra = item.campoLibero ? dati[item.campoLibero.id] : undefined;
                return (
                  <View key={item.id} style={styles.checkboxRiga}>
                    <Text style={styles.checkboxSimbolo}>{checked ? "[X]" : "[ ]"}</Text>
                    <Text style={styles.checkboxTesto}>
                      {item.label}
                      {item.campoLibero && extra ? ` — ${item.campoLibero.label}: ${extra}` : ""}
                    </Text>
                  </View>
                );
              })}
            </View>
          );
        }
        const valore = dati[b.campo.id];
        return (
          <View key={i} style={styles.campoRiga}>
            <Text style={styles.campoLabel}>{b.campo.label}</Text>
            <Text style={styles.campoValore}>{valore || "—"}</Text>
          </View>
        );
      })}
    </>
  );
}

function Firma({ label, dataUrl }: { label: string; dataUrl?: string | null }) {
  return (
    <View style={styles.firmaBox}>
      <Text style={styles.firmaLabel}>{label}</Text>
      {dataUrl ? (
        // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image, not the HTML/next Image element; no alt prop exists.
        <Image src={dataUrl} style={styles.firmaImg} />
      ) : (
        <View style={styles.firmaLinea} />
      )}
    </View>
  );
}

export function ModuloPdfDocument({
  studio,
  paziente,
  template,
  dati,
  consenso,
  consensoMultiplo,
  luogo,
  data,
  genitore1Nome,
  genitore2Nome,
  testimoneNome,
  firmaPazienteDataUrl,
  firmaGenitore1DataUrl,
  firmaGenitore2DataUrl,
  firmaOdontoiatraDataUrl,
}: ModuloPdfInput) {
  const nomeCompletoPaziente = `${paziente.cognome} ${paziente.nome}`;

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.headerBox}>
          <Text style={styles.headerLabel}>Studio</Text>
          <Text style={styles.headerValue}>{studio.name}</Text>
          {studio.indirizzo && <Text style={styles.headerValue}>{studio.indirizzo}{studio.citta ? `, ${studio.citta}` : ""}</Text>}
          {(studio.telefono || studio.email) && (
            <Text style={styles.headerValue}>{[studio.telefono, studio.email].filter(Boolean).join(" · ")}</Text>
          )}
          {studio.titolare && (
            <Text style={styles.headerValue}>
              Direttore Sanitario / Titolare: {studio.titolare}
              {studio.numeroAlboTitolare ? ` (n. Albo ${studio.numeroAlboTitolare})` : ""}
            </Text>
          )}
        </View>

        <Text style={styles.title}>{template.titolo.toUpperCase()}</Text>
        {template.sottotitolo && <Text style={styles.sottotitolo}>{template.sottotitolo}</Text>}

        <View style={styles.pazienteBox}>
          <Text style={{ fontSize: 9, fontWeight: 700, marginBottom: 4 }}>
            {template.richiedeDatiMinore ? "Dati del minore" : "Dati del paziente"}
          </Text>
          <View style={styles.pazienteRow}>
            <Text style={styles.pazienteLabel}>Cognome e Nome</Text>
            <Text style={styles.pazienteValue}>{nomeCompletoPaziente}</Text>
          </View>
          <View style={styles.pazienteRow}>
            <Text style={styles.pazienteLabel}>Nato/a a, il</Text>
            <Text style={styles.pazienteValue}>
              {paziente.luogoNascita || "—"}, {formatDate(paziente.dataNascita)}
            </Text>
          </View>
          <View style={styles.pazienteRow}>
            <Text style={styles.pazienteLabel}>Residenza</Text>
            <Text style={styles.pazienteValue}>{paziente.residenza || "—"}</Text>
          </View>
          <View style={styles.pazienteRow}>
            <Text style={styles.pazienteLabel}>Codice Fiscale</Text>
            <Text style={styles.pazienteValue}>{paziente.codiceFiscale || "—"}</Text>
          </View>
          <View style={styles.pazienteRow}>
            <Text style={styles.pazienteLabel}>Telefono / E-mail</Text>
            <Text style={styles.pazienteValue}>{[paziente.telefono, paziente.email].filter(Boolean).join(" · ") || "—"}</Text>
          </View>
          {template.richiedeDatiMinore && (
            <>
              <Text style={{ fontSize: 9, fontWeight: 700, marginTop: 6, marginBottom: 4 }}>Esercenti la responsabilità genitoriale / tutore</Text>
              <View style={styles.pazienteRow}>
                <Text style={styles.pazienteLabel}>Genitore 1 / Tutore</Text>
                <Text style={styles.pazienteValue}>{genitore1Nome || "—"}</Text>
              </View>
              <View style={styles.pazienteRow}>
                <Text style={styles.pazienteLabel}>Genitore 2</Text>
                <Text style={styles.pazienteValue}>{genitore2Nome || "—"}</Text>
              </View>
            </>
          )}
        </View>

        {template.sezioni.map((sezione, i) => (
          <View key={i} wrap>
            <Text style={styles.sezioneTitolo}>{sezione.titolo}</Text>
            <Blocchi blocchi={sezione.blocchi} dati={dati} />
          </View>
        ))}

        {template.tipoConsenso === "binario" && (
          <View style={{ marginTop: 8 }}>
            <View style={styles.checkboxRiga}>
              <Text style={styles.checkboxSimbolo}>{consenso === "ACCONSENTO" ? "[X]" : "[ ]"}</Text>
              <Text style={styles.checkboxTesto}>ACCONSENTO ad essere sottoposto/a al trattamento sopra descritto.</Text>
            </View>
            <View style={styles.checkboxRiga}>
              <Text style={styles.checkboxSimbolo}>{consenso === "NON_ACCONSENTO" ? "[X]" : "[ ]"}</Text>
              <Text style={styles.checkboxTesto}>NON ACCONSENTO al trattamento proposto, essendo stato/a informato/a delle possibili conseguenze del rifiuto.</Text>
            </View>
          </View>
        )}

        {template.tipoConsenso === "pedodonzia" && (
          <View style={{ marginTop: 8 }}>
            <View style={styles.checkboxRiga}>
              <Text style={styles.checkboxSimbolo}>{consenso === "ACCONSENTIAMO" ? "[X]" : "[ ]"}</Text>
              <Text style={styles.checkboxTesto}>ACCONSENTIAMO alle cure sopra indicate per il minore.</Text>
            </View>
            <View style={styles.checkboxRiga}>
              <Text style={styles.checkboxSimbolo}>{consenso === "NON_ACCONSENTIAMO" ? "[X]" : "[ ]"}</Text>
              <Text style={styles.checkboxTesto}>NON ACCONSENTIAMO alle cure proposte, informati delle possibili conseguenze del rifiuto.</Text>
            </View>
          </View>
        )}

        {template.tipoConsenso === "multiplo" && template.consensoMultiploVoci && (
          <View style={{ marginTop: 8 }}>
            {template.consensoMultiploVoci.map((voce) => {
              const scelta = consensoMultiplo?.[voce.id];
              return (
                <View key={voce.id} style={{ marginBottom: 5 }}>
                  <Text style={{ marginBottom: 2 }}>{voce.label}</Text>
                  <View style={{ flexDirection: "row", gap: 16 }}>
                    <View style={styles.checkboxRiga}>
                      <Text style={styles.checkboxSimbolo}>{scelta === "PRESTO" ? "[X]" : "[ ]"}</Text>
                      <Text>PRESTO IL CONSENSO</Text>
                    </View>
                    <View style={styles.checkboxRiga}>
                      <Text style={styles.checkboxSimbolo}>{scelta === "NEGO" ? "[X]" : "[ ]"}</Text>
                      <Text>NEGO IL CONSENSO</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {template.tipoConsenso === "dissenso" && testimoneNome && (
          <View style={{ marginTop: 4 }}>
            <Text style={styles.campoLabel}>Testimone (in caso di rifiuto di sottoscrizione)</Text>
            <Text style={styles.campoValore}>{testimoneNome}</Text>
          </View>
        )}

        <View style={{ marginTop: 10 }}>
          <Text style={styles.campoLabel}>Luogo e data</Text>
          <Text style={styles.campoValore}>
            {luogo || "—"}, {formatDate(data ?? null)}
          </Text>
        </View>

        <View style={styles.firmaRiga}>
          <Firma
            label={template.richiedeDatiMinore ? "Firma Genitore 1 / Tutore" : "Firma del paziente (o di chi esercita la responsabilità genitoriale)"}
            dataUrl={template.richiedeDatiMinore ? firmaGenitore1DataUrl : firmaPazienteDataUrl}
          />
          <Firma label="Firma e timbro dell'odontoiatra" dataUrl={firmaOdontoiatraDataUrl} />
        </View>
        {template.richiedeDatiMinore && (
          <View style={styles.firmaRiga}>
            <Firma label="Firma Genitore 2" dataUrl={firmaGenitore2DataUrl} />
          </View>
        )}

        {template.richiedeMinorenne && (
          <View style={{ marginTop: 14 }} wrap>
            <Text style={styles.sezioneTitolo}>Pazienti minorenni o legalmente incapaci</Text>
            <Text style={styles.paragrafo}>
              In caso di paziente minorenne, il consenso è espresso da entrambi gli esercenti la responsabilità genitoriale (art. 3, Legge
              219/2017). In caso di paziente interdetto o sottoposto ad amministrazione di sostegno con poteri in ambito sanitario, il
              consenso è espresso dal tutore o dall&apos;amministratore di sostegno, tenendo conto della volontà del paziente ove possibile.
            </Text>
            <View style={styles.firmaRiga}>
              <Firma label="Genitore 1 / Tutore" dataUrl={firmaGenitore1DataUrl} />
              <Firma label="Genitore 2" dataUrl={firmaGenitore2DataUrl} />
            </View>
          </View>
        )}

        {template.richiedeRevoca && (
          <View style={{ marginTop: 14 }} wrap>
            <Text style={styles.sezioneTitolo}>Revoca del consenso</Text>
            <Text style={styles.paragrafo}>
              Il consenso prestato può essere revocato in qualsiasi momento, anche quando la revoca comporti l&apos;interruzione del
              trattamento (art. 1, comma 5, Legge 219/2017).
            </Text>
            <Text style={styles.campoLabel}>Il sottoscritto REVOCA il consenso in data</Text>
            <View style={styles.firmaLinea} />
          </View>
        )}

        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}

export async function generateModuloPdfBuffer(input: ModuloPdfInput): Promise<Buffer> {
  return renderToBuffer(<ModuloPdfDocument {...input} />);
}
