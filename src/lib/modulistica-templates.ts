// Motore dati per la Modulistica: ogni voce di MODULO_TEMPLATES rappresenta uno
// dei 18 documenti forniti dal titolare, trascritto fedelmente. Il testo legale
// è statico (uguale per tutti gli studi); solo i campi/checkbox specifici
// vengono compilati per paziente in ModuloCompilato.dati (vedi actions/modulistica.ts).
//
// Ogni template è composto da "sezioni" con "blocchi" di 4 tipi:
// - paragrafo: testo informativo fisso
// - lista: elenco puntato fisso (nessuna scelta del compilatore)
// - checkbox: gruppo di opzioni selezionabili, alcune con un campo libero abbinato
// - campo: singolo campo libero compilabile
//
// La stessa struttura guida sia il form di compilazione (src/components/app/
// modulo-compilazione-form.tsx) sia il documento PDF (src/lib/modulistica-pdf.tsx).

export type CampoLiberoDef = { id: string; label: string; multilinea?: boolean };
export type CheckboxItem = { id: string; label: string; campoLibero?: CampoLiberoDef };

export type BloccoParagrafo = { tipo: "paragrafo"; testo: string };
export type BloccoLista = { tipo: "lista"; voci: string[] };
export type BloccoCheckbox = { tipo: "checkbox"; items: CheckboxItem[] };
export type BloccoCampo = { tipo: "campo"; campo: CampoLiberoDef };
export type Blocco = BloccoParagrafo | BloccoLista | BloccoCheckbox | BloccoCampo;

export type Sezione = { titolo: string; blocchi: Blocco[] };

export type TipoConsenso = "binario" | "multiplo" | "dissenso" | "pedodonzia" | "nessuno";

export type ModuloTemplate = {
  key: string;
  numero: number;
  titolo: string;
  sottotitolo?: string;
  sezioni: Sezione[];
  tipoConsenso: TipoConsenso;
  /** Solo per tipoConsenso "multiplo": una riga PRESTO/NEGO IL CONSENSO per voce. */
  consensoMultiploVoci?: { id: string; label: string }[];
  richiedeMinorenne: boolean;
  richiedeRevoca: boolean;
  /** Pedodonzia: intestazione "Dati del minore" + genitori come firmatari principali. */
  richiedeDatiMinore?: boolean;
};

// I 7 punti della dichiarazione del paziente sono identici in quasi tutti i
// consensi clinici: cambia solo la descrizione del trattamento nel primo punto.
function dichiarazioneStandard(descrizioneTrattamento: string): BloccoLista {
  return {
    tipo: "lista",
    voci: [
      `di aver ricevuto dall'odontoiatra, in modo chiaro e comprensibile, informazioni complete su diagnosi, natura e finalità di ${descrizioneTrattamento}, modalità di esecuzione, benefici attesi, rischi e complicanze prevedibili, alternative terapeutiche disponibili e conseguenze dell'eventuale rifiuto del trattamento (art. 1, Legge 219/2017);`,
      "di aver avuto la possibilità di porre domande e di aver ricevuto risposte esaurienti;",
      "di aver avuto tempo sufficiente per riflettere prima di sottoscrivere il presente consenso;",
      "di aver fornito informazioni anamnestiche complete e veritiere sul proprio stato di salute;",
      "di essere consapevole che la medicina non è una scienza esatta e che non è possibile garantire con certezza il risultato del trattamento;",
      "di essere consapevole che il piano di trattamento potrà subire modifiche in corso d'opera per esigenze cliniche sopravvenute; ove possibile, ogni variazione significativa sarà preventivamente concordata;",
      "di poter revocare il presente consenso in qualsiasi momento.",
    ],
  };
}

export const MODULO_TEMPLATES: ModuloTemplate[] = [
  // 01 — Informativa Privacy e Consenso GDPR
  {
    key: "PRIVACY_GDPR",
    numero: 1,
    titolo: "Informativa sul trattamento dei dati personali e consenso",
    sottotitolo: "ai sensi degli artt. 13 e 9 del Regolamento (UE) 2016/679 (GDPR) e del D.Lgs. 196/2003",
    tipoConsenso: "multiplo",
    consensoMultiploVoci: [
      { id: "promemoria", label: "Invio di promemoria appuntamenti e richiami periodici (SMS, e-mail, telefono, WhatsApp)" },
      { id: "promozionale", label: "Invio di comunicazioni informative e promozionali sui servizi dello studio" },
      { id: "foto_anonime", label: "Utilizzo di fotografie cliniche in forma anonima per finalità scientifiche/divulgative" },
    ],
    richiedeMinorenne: true,
    richiedeRevoca: false,
    sezioni: [
      {
        titolo: "1. Titolare del trattamento",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "Il Titolare del trattamento è lo Studio Odontoiatrico indicato nell'intestazione del presente documento, nella persona del suo legale rappresentante / titolare, contattabile ai recapiti sopra riportati.",
          },
          { tipo: "campo", campo: { id: "dpo", label: "Eventuale Responsabile della Protezione dei Dati (DPO), se nominato" } },
        ],
      },
      {
        titolo: "2. Categorie di dati trattati",
        blocchi: [
          {
            tipo: "lista",
            voci: [
              "Dati anagrafici e di contatto (nome, cognome, data e luogo di nascita, residenza, codice fiscale, telefono, e-mail);",
              "Dati relativi alla salute (art. 9 GDPR): anamnesi, diagnosi, radiografie, fotografie cliniche, impronte e scansioni digitali, piani di trattamento, referti, prescrizioni;",
              "Dati amministrativi, contabili e fiscali connessi alle prestazioni erogate.",
            ],
          },
        ],
      },
      {
        titolo: "3. Finalità e basi giuridiche del trattamento",
        blocchi: [
          {
            tipo: "lista",
            voci: [
              "a) Finalità di diagnosi, cura e prevenzione odontoiatrica: base giuridica art. 9, par. 2, lett. h) GDPR, in conformità al Provvedimento del Garante del 7 marzo 2019, che chiarisce che il trattamento dei dati per finalità di cura da parte di un professionista sanitario soggetto al segreto professionale non richiede il consenso dell'interessato.",
              "b) Adempimenti amministrativi, contabili e fiscali (fatturazione, invio al Sistema Tessera Sanitaria salvo opposizione): base giuridica obbligo legale (art. 6, par. 1, lett. c) GDPR).",
              "c) Difesa di un diritto in sede giudiziaria e gestione del contenzioso: legittimo interesse del Titolare (art. 6, par. 1, lett. f) GDPR).",
              "d) Finalità facoltative, subordinate al consenso esplicito dell'interessato: invio di promemoria appuntamenti e richiami periodici di igiene/controllo; comunicazioni informative e promozionali sui servizi dello studio; utilizzo di fotografie cliniche in forma anonima per finalità scientifiche o divulgative.",
            ],
          },
        ],
      },
      {
        titolo: "4. Modalità di trattamento e conservazione",
        blocchi: [
          {
            tipo: "lista",
            voci: [
              "I dati sono trattati con strumenti cartacei ed elettronici, con misure di sicurezza adeguate ai sensi dell'art. 32 GDPR;",
              "La documentazione sanitaria è conservata per il tempo necessario alle finalità di cura e, in ogni caso, per il periodo richiesto dagli obblighi di legge e dalle esigenze di tutela in sede giudiziaria (si raccomanda la conservazione della documentazione clinica per almeno 10 anni dall'ultima prestazione);",
              "I dati fiscali e contabili sono conservati per 10 anni ai sensi dell'art. 2220 c.c.;",
              "I dati trattati per finalità promozionali sono conservati fino a revoca del consenso.",
            ],
          },
        ],
      },
      {
        titolo: "5. Destinatari dei dati",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "I dati potranno essere comunicati, per le sole finalità sopra indicate, a: personale sanitario e di segreteria dello studio, autorizzato e istruito ai sensi dell'art. 29 GDPR; odontotecnici e laboratori per la realizzazione di dispositivi medici su misura; consulenti medici e strutture sanitarie coinvolte nel percorso di cura; commercialista e consulenti amministrativi; fornitori di software gestionali e servizi informatici, nominati Responsabili del trattamento ex art. 28 GDPR; enti pubblici nei casi previsti dalla legge (ASL, Agenzia delle Entrate, Sistema Tessera Sanitaria). I dati non sono oggetto di diffusione né di trasferimento extra-UE, salvo garanzie adeguate ai sensi degli artt. 44 e ss. GDPR.",
          },
        ],
      },
      {
        titolo: "6. Diritti dell'interessato",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "L'interessato può esercitare in qualsiasi momento i diritti di cui agli artt. 15-22 GDPR: accesso, rettifica, cancellazione (nei limiti degli obblighi di conservazione), limitazione, portabilità, opposizione, revoca del consenso. È inoltre possibile proporre reclamo al Garante per la Protezione dei Dati Personali (www.garanteprivacy.it). Le richieste vanno rivolte al Titolare ai recapiti indicati nell'intestazione.",
          },
        ],
      },
      {
        titolo: "7. Natura del conferimento",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "Il conferimento dei dati necessari alle finalità di cura e agli obblighi di legge è indispensabile: il rifiuto comporta l'impossibilità di erogare le prestazioni sanitarie. Il conferimento dei dati per le finalità facoltative di cui al punto 3, lett. d) è libero e il rifiuto non pregiudica in alcun modo l'accesso alle cure.",
          },
        ],
      },
    ],
  },

  // 02 — Scheda Anamnestica
  {
    key: "ANAMNESI",
    numero: 2,
    titolo: "Scheda anamnestica",
    sottotitolo: "Questionario sullo stato di salute generale e odontoiatrico — da aggiornare ad ogni variazione clinicamente rilevante",
    tipoConsenso: "nessuno",
    richiedeMinorenne: true,
    richiedeRevoca: false,
    sezioni: [
      {
        titolo: "Informazioni generali",
        blocchi: [
          { tipo: "campo", campo: { id: "medico_curante", label: "Medico curante (nome e recapito)" } },
          { tipo: "campo", campo: { id: "professione", label: "Professione" } },
        ],
      },
      {
        titolo: "1. Anamnesi medica generale",
        blocchi: [
          {
            tipo: "checkbox",
            items: [
              { id: "cardiopatie", label: "Malattie cardiache (infarto, angina, aritmie, scompenso)" },
              { id: "ipertensione", label: "Ipertensione arteriosa" },
              { id: "protesi_valvolari", label: "Portatore di protesi valvolari / rischio di endocardite" },
              { id: "pacemaker", label: "Portatore di pacemaker o defibrillatore" },
              { id: "diabete", label: "Diabete mellito", campoLibero: { id: "diabete_dettaglio", label: "Tipo e compensato (SÌ/NO)" } },
              { id: "respiratorie", label: "Malattie respiratorie (asma, BPCO)" },
              { id: "epatiche", label: "Malattie epatiche (epatite B / C, cirrosi)" },
              { id: "renali", label: "Malattie renali" },
              { id: "tiroide", label: "Malattie della tiroide" },
              { id: "neurologiche", label: "Malattie neurologiche (epilessia, ictus, Parkinson)" },
              { id: "coagulazione", label: "Disturbi della coagulazione / facilità al sanguinamento" },
              { id: "anemia", label: "Anemia o altre malattie del sangue" },
              { id: "osteoporosi", label: "Osteoporosi" },
              { id: "autoimmuni", label: "Malattie autoimmuni o reumatiche" },
              { id: "neoplasie", label: "Neoplasie (attuali o pregresse) / radioterapia testa-collo / chemioterapia" },
              { id: "hiv", label: "HIV / immunodepressione" },
              { id: "infettive", label: "Malattie infettive in atto" },
              { id: "psichiatrici", label: "Disturbi psichiatrici / ansia / attacchi di panico" },
              { id: "glaucoma", label: "Glaucoma" },
              { id: "reflusso", label: "Reflusso gastroesofageo / gastrite / ulcera" },
            ],
          },
          { tipo: "campo", campo: { id: "altre_patologie", label: "Altre patologie non elencate" } },
        ],
      },
      {
        titolo: "2. Terapie farmacologiche in corso",
        blocchi: [
          {
            tipo: "checkbox",
            items: [
              { id: "anticoagulanti", label: "Anticoagulanti / antiaggreganti (es. warfarin, NAO/DOAC, aspirina, clopidogrel)" },
              {
                id: "bifosfonati",
                label: "Bifosfonati o farmaci per l'osteoporosi / antiriassorbitivi (es. alendronato, denosumab) — anche in passato",
                campoLibero: { id: "bifosfonati_dettaglio", label: "Da quando e per quale via (orale/endovenosa)" },
              },
              { id: "cortisonici", label: "Cortisonici" },
              { id: "immunosoppressori", label: "Immunosoppressori / farmaci biologici" },
              { id: "insulina", label: "Insulina / antidiabetici orali" },
              { id: "antidepressivi", label: "Antidepressivi / ansiolitici" },
            ],
          },
          { tipo: "campo", campo: { id: "elenco_farmaci", label: "Elenco completo dei farmaci assunti", multilinea: true } },
        ],
      },
      {
        titolo: "3. Allergie",
        blocchi: [
          {
            tipo: "checkbox",
            items: [
              { id: "allergia_anestetici", label: "Anestetici locali" },
              { id: "allergia_antibiotici", label: "Antibiotici", campoLibero: { id: "allergia_antibiotici_dettaglio", label: "Specificare" } },
              { id: "allergia_fans", label: "Antinfiammatori / analgesici (es. FANS, paracetamolo)" },
              { id: "allergia_lattice", label: "Lattice" },
              { id: "allergia_metalli", label: "Metalli (es. nichel)" },
            ],
          },
          { tipo: "campo", campo: { id: "altre_allergie", label: "Altre allergie o intolleranze" } },
        ],
      },
      {
        titolo: "4. Stili di vita e altre informazioni",
        blocchi: [
          {
            tipo: "checkbox",
            items: [
              { id: "fumatore", label: "Fumatore/trice", campoLibero: { id: "fumatore_dettaglio", label: "N. sigarette/giorno e da quanti anni" } },
              { id: "alcol", label: "Consumo regolare di alcol" },
              { id: "stupefacenti", label: "Uso di sostanze stupefacenti" },
              { id: "gravidanza", label: "Gravidanza in corso", campoLibero: { id: "gravidanza_settimana", label: "Settimana" } },
              { id: "allattamento", label: "Allattamento in corso" },
            ],
          },
        ],
      },
      {
        titolo: "5. Anamnesi odontoiatrica",
        blocchi: [
          {
            tipo: "checkbox",
            items: [
              { id: "reazioni_anestesia", label: "Precedenti reazioni avverse all'anestesia locale" },
              { id: "sanguinamento_prolungato", label: "Sanguinamento prolungato dopo estrazioni o interventi" },
              { id: "bruxismo", label: "Bruxismo / serramento (digrignamento dei denti)" },
              { id: "atm", label: "Dolori o rumori all'articolazione temporo-mandibolare" },
              { id: "sanguinamento_gengivale", label: "Sanguinamento gengivale / mobilità dentale" },
              { id: "precedenti_trattamenti", label: "Precedenti trattamenti ortodontici / implantari / parodontali" },
            ],
          },
          { tipo: "campo", campo: { id: "motivo_visita", label: "Motivo principale della visita" } },
        ],
      },
      {
        titolo: "Dichiarazione del paziente",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "Il/La sottoscritto/a dichiara che le informazioni fornite nella presente scheda sono complete e veritiere, di non aver omesso alcuna informazione rilevante sul proprio stato di salute e si impegna a comunicare tempestivamente allo studio ogni variazione (nuove patologie, nuovi farmaci, gravidanza). È consapevole che informazioni incomplete o inesatte possono compromettere la sicurezza e l'esito delle cure e sollevano l'odontoiatra da responsabilità per conseguenze derivanti da dati non dichiarati.",
          },
        ],
      },
    ],
  },

  // 03 — Consenso Informato Generale
  {
    key: "CONSENSO_GENERALE",
    numero: 3,
    titolo: "Consenso informato generale alle cure odontoiatriche",
    sottotitolo: "ai sensi della Legge 22 dicembre 2017, n. 219 e del Codice di Deontologia Medica (art. 35)",
    tipoConsenso: "binario",
    richiedeMinorenne: true,
    richiedeRevoca: true,
    sezioni: [
      {
        titolo: "1. Diagnosi e piano di trattamento proposto",
        blocchi: [
          { tipo: "campo", campo: { id: "diagnosi", label: "Diagnosi", multilinea: true } },
          { tipo: "campo", campo: { id: "piano_trattamento", label: "Piano di trattamento proposto", multilinea: true } },
          { tipo: "campo", campo: { id: "numero_sedute", label: "Numero di sedute previsto (indicativo)" } },
          {
            tipo: "paragrafo",
            testo: "Il preventivo economico dettagliato è consegnato in documento separato, che il paziente dichiara di aver ricevuto e compreso.",
          },
        ],
      },
      {
        titolo: "2. Informazioni generali sulle cure odontoiatriche",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "Le cure odontoiatriche possono comprendere, a seconda del piano di trattamento: visite e diagnostica radiologica, igiene orale professionale e terapia parodontale, odontoiatria conservativa (otturazioni, ricostruzioni), endodonzia, estrazioni e chirurgia orale, protesi, implantologia, ortodonzia. Per i trattamenti a maggiore complessità o invasività verrà richiesto un consenso informato specifico aggiuntivo.",
          },
          {
            tipo: "lista",
            voci: [
              "reazioni all'anestesia locale (raramente reazioni allergiche, malessere, ematomi, transitorie alterazioni della sensibilità);",
              "dolore, gonfiore, sanguinamento e fastidio post-operatorio;",
              "sensibilità dentale transitoria o persistente dopo trattamenti conservativi o di igiene;",
              "possibile necessità di modificare il piano di cura in corso d'opera, sulla base dei riscontri clinici;",
              "insuccesso o durata limitata nel tempo dei restauri, influenzata da igiene domiciliare, abitudini (fumo, bruxismo), controlli periodici e caratteristiche individuali.",
            ],
          },
        ],
      },
      {
        titolo: "3. Radiografie",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "Gli esami radiografici endorali e panoramici eseguiti nello studio sono giustificati da esigenze diagnostiche e ottimizzati secondo il principio ALARA, in conformità al D.Lgs. 101/2020. La dose di radiazioni impiegata è molto bassa; in caso di gravidanza, la paziente è tenuta a segnalarlo prima di ogni esame.",
          },
        ],
      },
      {
        titolo: "4. Alternative e conseguenze del mancato trattamento",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "Le alternative terapeutiche al piano proposto, comprese le rispettive implicazioni, sono state illustrate durante il colloquio. Il mancato trattamento delle patologie diagnosticate può comportare l'aggravamento delle stesse (progressione di carie e malattia parodontale, infezioni, ascessi, perdita di elementi dentali) con cure successive più complesse e costose.",
          },
        ],
      },
      {
        titolo: "5. Obblighi di collaborazione del paziente",
        blocchi: [
          {
            tipo: "lista",
            voci: [
              "presentarsi agli appuntamenti concordati e ai controlli periodici;",
              "seguire le istruzioni di igiene orale domiciliare e le prescrizioni ricevute;",
              "comunicare tempestivamente variazioni dello stato di salute e delle terapie farmacologiche;",
              "segnalare prontamente qualsiasi problema insorto durante o dopo le cure.",
            ],
          },
        ],
      },
      {
        titolo: "Dichiarazione del paziente",
        blocchi: [dichiarazioneStandard("il piano di cure odontoiatriche sopra indicato")],
      },
    ],
  },

  // 04 — Chirurgia Orale / Estrazioni
  {
    key: "CHIRURGIA_ORALE",
    numero: 4,
    titolo: "Consenso informato all'estrazione dentaria e alla chirurgia orale",
    sottotitolo: "ai sensi della Legge 22 dicembre 2017, n. 219",
    tipoConsenso: "binario",
    richiedeMinorenne: true,
    richiedeRevoca: true,
    sezioni: [
      {
        titolo: "1. Trattamento proposto",
        blocchi: [
          {
            tipo: "checkbox",
            items: [
              { id: "estrazione_semplice", label: "Estrazione semplice", campoLibero: { id: "estrazione_semplice_elementi", label: "Elemento/i n." } },
              {
                id: "estrazione_chirurgica",
                label: "Estrazione chirurgica / dente incluso o semincluso",
                campoLibero: { id: "estrazione_chirurgica_elementi", label: "Elemento/i n." },
              },
              { id: "terzo_molare", label: "Estrazione di terzo molare (dente del giudizio)", campoLibero: { id: "terzo_molare_elementi", label: "Elemento/i n." } },
              { id: "altro_chirurgia", label: "Altro intervento di chirurgia orale", campoLibero: { id: "altro_chirurgia_dettaglio", label: "Specificare" } },
            ],
          },
          { tipo: "campo", campo: { id: "motivazione_clinica", label: "Motivazione clinica", multilinea: true } },
        ],
      },
      {
        titolo: "2. Descrizione dell'intervento",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "L'intervento viene eseguito in anestesia locale e consiste nella rimozione dell'elemento dentario o del tessuto patologico indicato. Negli interventi chirurgici può essere necessario incidere la gengiva, rimuovere una quota di osso circostante, sezionare il dente in più parti e applicare punti di sutura. La durata e la complessità dipendono dalla posizione dell'elemento e dai rapporti anatomici con strutture vicine (nervi, seno mascellare, denti adiacenti), valutati anche tramite esami radiografici.",
          },
        ],
      },
      {
        titolo: "3. Alternative terapeutiche",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "Ove clinicamente possibile, le alternative all'estrazione (terapie conservative, endodontiche o parodontali, mantenimento sotto controllo dell'elemento incluso asintomatico) sono state illustrate. Nel caso specifico, l'estrazione rappresenta l'opzione clinicamente indicata per le motivazioni sopra riportate.",
          },
        ],
      },
      {
        titolo: "4. Rischi e complicanze possibili",
        blocchi: [
          {
            tipo: "lista",
            voci: [
              "dolore, gonfiore, ematoma, difficoltà di apertura della bocca (trisma) nei giorni successivi;",
              "sanguinamento post-operatorio, in genere controllabile con compressione;",
              "infezione del sito chirurgico e alveolite, più frequente nei fumatori;",
              "lesione temporanea o, raramente, permanente del nervo alveolare inferiore o del nervo linguale, con alterazioni della sensibilità di labbro, mento, lingua, in particolare nell'estrazione degli ottavi inferiori;",
              "comunicazione oro-antrale nell'estrazione di elementi superiori posteriori, con eventuale necessità di chiusura chirurgica;",
              "frattura di radici con possibile permanenza di frammenti, frattura di strumenti, danni a denti o restauri adiacenti;",
              "rara frattura mandibolare in estrazioni complesse di elementi inclusi profondi;",
              "reazioni all'anestetico locale;",
              "nei pazienti in terapia con bifosfonati/antiriassorbitivi o sottoposti a radioterapia testa-collo: rischio di osteonecrosi dei mascellari (MRONJ/ORN), discusso specificamente.",
            ],
          },
        ],
      },
      {
        titolo: "5. Conseguenze del mancato trattamento",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "Il mancato trattamento può comportare persistenza o aggravamento di infezioni e ascessi (con possibile diffusione ai tessuti del collo e complicanze sistemiche anche gravi), dolore, danno agli elementi adiacenti, cisti e lesioni ossee.",
          },
        ],
      },
      {
        titolo: "6. Istruzioni post-operatorie",
        blocchi: [
          {
            tipo: "lista",
            voci: [
              "mantenere la compressione con garza per il tempo indicato; non sciacquare energicamente nelle prime 24 ore;",
              "non fumare per almeno 48-72 ore; evitare alcol, cibi caldi e sforzi fisici nelle prime 24-48 ore;",
              "applicare ghiaccio esternamente a intervalli nelle prime ore; assumere i farmaci prescritti secondo le indicazioni;",
              "riprendere una delicata igiene orale dal giorno successivo, evitando la zona della ferita;",
              "contattare lo studio in caso di sanguinamento persistente, dolore ingravescente dopo 2-3 giorni, febbre o gonfiore in aumento;",
              "presentarsi al controllo/rimozione punti nella data concordata.",
            ],
          },
        ],
      },
      {
        titolo: "Dichiarazione del paziente",
        blocchi: [dichiarazioneStandard("l'intervento di estrazione/chirurgia orale sopra indicato")],
      },
    ],
  },

  // 05 — Implantologia
  {
    key: "IMPLANTOLOGIA",
    numero: 5,
    titolo: "Consenso informato al trattamento implantologico",
    sottotitolo: "ai sensi della Legge 22 dicembre 2017, n. 219",
    tipoConsenso: "binario",
    richiedeMinorenne: true,
    richiedeRevoca: true,
    sezioni: [
      {
        titolo: "1. Trattamento proposto",
        blocchi: [
          { tipo: "campo", campo: { id: "impianti_sedi", label: "Numero di impianti previsti e sedi (elementi n.)" } },
          {
            tipo: "checkbox",
            items: [
              { id: "rialzo_seno", label: "Rialzo del seno mascellare (grande / piccolo rialzo)" },
              { id: "gbr", label: "Rigenerazione ossea guidata (GBR) / innesto osseo" },
              { id: "carico_immediato", label: "Carico immediato" },
              { id: "carico_differito", label: "Carico differito (protesizzazione dopo osteointegrazione, indicativamente 2-6 mesi)" },
            ],
          },
          {
            tipo: "campo",
            campo: { id: "tipo_riabilitazione", label: "Tipo di riabilitazione protesica prevista (corona singola, ponte, protesi fissa su impianti, overdenture)", multilinea: true },
          },
        ],
      },
      {
        titolo: "2. Descrizione del trattamento",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "L'implantologia consiste nell'inserimento chirurgico, in anestesia locale, di una o più viti in titanio (impianti) nell'osso mascellare o mandibolare, destinate a sostituire le radici di denti mancanti e a sostenere una riabilitazione protesica. Il trattamento si articola in: fase diagnostica (esame clinico, radiografie, eventuale TC cone beam), fase chirurgica, periodo di guarigione/osteointegrazione e fase protesica. In presenza di volume osseo insufficiente possono rendersi necessarie procedure aggiuntive di aumento osseo, con tempi e costi ulteriori.",
          },
        ],
      },
      {
        titolo: "3. Alternative terapeutiche",
        blocchi: [
          {
            tipo: "lista",
            voci: [
              "protesi fissa tradizionale (ponte) con preparazione dei denti adiacenti;",
              "protesi rimovibile parziale o totale;",
              "nessun trattamento, con le conseguenze descritte al punto 5.",
            ],
          },
        ],
      },
      {
        titolo: "4. Rischi, complicanze e limiti del trattamento",
        blocchi: [
          {
            tipo: "paragrafo",
            testo: "Fase chirurgica e post-operatoria:",
          },
          {
            tipo: "lista",
            voci: [
              "dolore, gonfiore, ematomi, sanguinamento, infezione del sito chirurgico, deiscenza della ferita;",
              "lesione temporanea o, raramente, permanente del nervo alveolare inferiore o linguale con alterazioni della sensibilità di labbro, mento o lingua (impianti mandibolari posteriori);",
              "perforazione della membrana del seno mascellare, sinusite (impianti mascellari posteriori e rialzo del seno);",
              "danno a denti adiacenti o a strutture anatomiche contigue; rara frattura ossea.",
            ],
          },
          { tipo: "paragrafo", testo: "Esito del trattamento:" },
          {
            tipo: "lista",
            voci: [
              "mancata osteointegrazione con perdita precoce dell'impianto (percentuali di successo elevate, ma non garantibili nel singolo caso);",
              "perimplantite: infezione dei tessuti attorno all'impianto che può condurre, anche a distanza di anni, a riassorbimento osseo e perdita dell'impianto;",
              "complicanze protesiche: allentamento o frattura di viti, componenti o ceramiche, necessità di riparazioni o rifacimenti nel tempo;",
              "esiti estetici non ottimali (recessioni dei tessuti molli, visibilità di componenti), in particolare in zona estetica;",
              "fattori che riducono significativamente le probabilità di successo: fumo, diabete non compensato, malattia parodontale non trattata, scarsa igiene orale, bruxismo, terapie con bifosfonati/antiriassorbitivi, radioterapia testa-collo.",
            ],
          },
          {
            tipo: "paragrafo",
            testo:
              "In caso di perdita dell'impianto, potrà essere valutato un nuovo inserimento dopo adeguata guarigione, oppure una soluzione protesica alternativa.",
          },
        ],
      },
      {
        titolo: "5. Conseguenze del mancato trattamento",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "La mancata sostituzione degli elementi dentali persi può comportare: progressivo riassorbimento dell'osso, migrazione e sovraeruzione dei denti contigui e antagonisti, alterazioni della masticazione e dell'occlusione, difficoltà fonetiche ed estetiche.",
          },
        ],
      },
      {
        titolo: "6. Obblighi di mantenimento",
        blocchi: [
          {
            tipo: "lista",
            voci: [
              "igiene orale domiciliare scrupolosa secondo le istruzioni ricevute;",
              "sedute di igiene professionale e controlli periodici secondo il richiamo programmato (di norma ogni 4-6 mesi);",
              "astensione dal fumo, fortemente raccomandata;",
              "utilizzo del bite notturno, se prescritto per bruxismo.",
            ],
          },
          {
            tipo: "paragrafo",
            testo:
              "Il mancato rispetto dei richiami e delle istruzioni di igiene costituisce fattore determinante di insuccesso e può incidere sull'applicabilità di eventuali garanzie sul manufatto protesico.",
          },
        ],
      },
      {
        titolo: "Dichiarazione del paziente",
        blocchi: [dichiarazioneStandard("il trattamento implantologico e le eventuali procedure di aumento osseo sopra indicate")],
      },
    ],
  },

  // 06 — Endodonzia
  {
    key: "ENDODONZIA",
    numero: 6,
    titolo: "Consenso informato al trattamento endodontico",
    sottotitolo: "devitalizzazione / ritrattamento canalare — ai sensi della Legge 22 dicembre 2017, n. 219",
    tipoConsenso: "binario",
    richiedeMinorenne: true,
    richiedeRevoca: true,
    sezioni: [
      {
        titolo: "1. Trattamento proposto",
        blocchi: [
          {
            tipo: "checkbox",
            items: [
              { id: "devitalizzazione", label: "Trattamento endodontico (devitalizzazione)", campoLibero: { id: "devitalizzazione_elementi", label: "Elemento/i n." } },
              { id: "ritrattamento", label: "Ritrattamento endodontico (rifacimento di cura canalare precedente)", campoLibero: { id: "ritrattamento_elementi", label: "Elemento/i n." } },
            ],
          },
          {
            tipo: "campo",
            campo: { id: "motivazione_clinica", label: "Motivazione clinica (carie profonda, pulpite, necrosi, lesione periapicale, esigenze protesiche)", multilinea: true },
          },
        ],
      },
      {
        titolo: "2. Descrizione del trattamento",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "Il trattamento endodontico consiste nella rimozione della polpa dentale infiammata o infetta, nella detersione, sagomatura e disinfezione dei canali radicolari e nella loro otturazione tridimensionale con materiali idonei. Viene eseguito in anestesia locale, di norma con isolamento del campo tramite diga di gomma, in una o più sedute, con controlli radiografici intraoperatori. Nel ritrattamento si rimuovono inoltre i materiali della precedente otturazione canalare, con complessità e incertezza di risultato maggiori. Al termine, il dente dovrà essere restaurato in modo adeguato (ricostruzione e, ove indicato, corona protesica), poiché l'elemento trattato endodonticamente risulta più fragile e soggetto a frattura.",
          },
        ],
      },
      {
        titolo: "3. Alternative terapeutiche",
        blocchi: [
          {
            tipo: "lista",
            voci: [
              "estrazione dell'elemento e successiva eventuale sostituzione (impianto, ponte, protesi rimovibile);",
              "nessun trattamento, con le conseguenze descritte al punto 5.",
            ],
          },
        ],
      },
      {
        titolo: "4. Rischi, complicanze e limiti del trattamento",
        blocchi: [
          {
            tipo: "lista",
            voci: [
              "dolore o fastidio post-operatorio per alcuni giorni; possibile riacutizzazione infettiva (flare-up) tra le sedute, gestibile con terapia adeguata;",
              "anatomia canalare complessa: canali calcificati, curvi o accessori possono impedire la completa detersione e otturazione;",
              "frattura di strumenti all'interno dei canali, con eventuale permanenza del frammento;",
              "perforazioni radicolari o del pavimento della camera pulpare, in particolare nei ritrattamenti;",
              "estrusione oltre apice di materiali o irriganti, con possibile irritazione dei tessuti;",
              "colorazione scura del dente trattato nel tempo;",
              "insuccesso della terapia (persistenza o comparsa di lesione periapicale): percentuali di successo elevate ma non garantibili nel singolo caso; in caso di insuccesso possono rendersi necessari ritrattamento, chirurgia endodontica (apicectomia) o estrazione;",
              "frattura del dente trattato, anche a distanza di tempo, soprattutto se non protetto da adeguato restauro.",
            ],
          },
        ],
      },
      {
        titolo: "5. Conseguenze del mancato trattamento",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "La mancata cura di un dente con polpa infiammata o necrotica comporta la persistenza o l'aggravamento dell'infezione, con dolore, ascessi, granulomi, cisti, riassorbimento osseo e, nei casi più gravi, diffusione dell'infezione ai tessuti circostanti; l'unica alternativa diviene l'estrazione.",
          },
        ],
      },
      {
        titolo: "6. Indicazioni successive",
        blocchi: [
          {
            tipo: "lista",
            voci: [
              "evitare di masticare cibi duri sul dente trattato fino al restauro definitivo;",
              "completare il restauro definitivo (ricostruzione/corona) nei tempi indicati dall'odontoiatra;",
              "presentarsi ai controlli clinici e radiografici periodici programmati.",
            ],
          },
        ],
      },
      {
        titolo: "Dichiarazione del paziente",
        blocchi: [dichiarazioneStandard("il trattamento endodontico sopra indicato")],
      },
    ],
  },

  // 07 — Protesi
  {
    key: "PROTESI",
    numero: 7,
    titolo: "Consenso informato al trattamento protesico",
    sottotitolo: "protesi fissa e protesi rimovibile — ai sensi della Legge 22 dicembre 2017, n. 219",
    tipoConsenso: "binario",
    richiedeMinorenne: true,
    richiedeRevoca: true,
    sezioni: [
      {
        titolo: "1. Trattamento proposto",
        blocchi: [
          {
            tipo: "checkbox",
            items: [
              { id: "corona_singola", label: "Corona singola", campoLibero: { id: "corona_singola_elementi", label: "Elemento/i n." } },
              { id: "ponte", label: "Ponte", campoLibero: { id: "ponte_elementi", label: "Elementi n." } },
              { id: "intarsio", label: "Intarsio / faccetta", campoLibero: { id: "intarsio_elementi", label: "Elemento/i n." } },
              { id: "protesi_parziale", label: "Protesi parziale rimovibile (scheletrato)" },
              { id: "protesi_totale", label: "Protesi totale rimovibile" },
              { id: "protesi_impianti", label: "Protesi su impianti (vedere anche consenso implantologico)" },
            ],
          },
          { tipo: "campo", campo: { id: "materiali", label: "Materiali previsti (metallo-ceramica, zirconia, disilicato, resina, ecc.)" } },
        ],
      },
      {
        titolo: "2. Descrizione del trattamento",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "La riabilitazione protesica sostituisce o ricopre elementi dentali compromessi o mancanti. La protesi fissa richiede la preparazione (limatura) dei denti pilastro, la rilevazione di impronte o scansioni digitali, l'applicazione di manufatti provvisori e la cementazione dei manufatti definitivi realizzati da laboratorio odontotecnico, che rilascia la dichiarazione di conformità del dispositivo su misura ai sensi del Regolamento (UE) 2017/745. La protesi rimovibile viene realizzata tramite impronte e prove successive e può richiedere ribasature e adattamenti nel tempo.",
          },
        ],
      },
      {
        titolo: "3. Alternative terapeutiche",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "Le alternative dipendono dal caso clinico e comprendono: restauri conservativi diretti ove possibile, implantologia, diverse tipologie di protesi (fissa/rimovibile), o il mancato trattamento con le conseguenze indicate al punto 5. Le opzioni applicabili al caso specifico, con relativi vantaggi, limiti e costi, sono state illustrate.",
          },
        ],
      },
      {
        titolo: "4. Rischi, complicanze e limiti del trattamento",
        blocchi: [
          { tipo: "paragrafo", testo: "Protesi fissa:" },
          {
            tipo: "lista",
            voci: [
              "la preparazione del dente vitale può causare sensibilità transitoria o, in una percentuale di casi, infiammazione irreversibile della polpa con successiva necessità di devitalizzazione, anche a distanza di tempo;",
              "decementazione, infiltrazione ai margini, carie secondaria dei pilastri;",
              "scheggiatura o frattura del rivestimento ceramico;",
              "recessioni gengivali con esposizione del margine protesico ed esiti estetici non ottimali;",
              "possibile necessità di rifacimento del manufatto nel tempo: ogni protesi ha una durata limitata, influenzata da igiene, carico masticatorio, bruxismo e controlli periodici.",
            ],
          },
          { tipo: "paragrafo", testo: "Protesi rimovibile:" },
          {
            tipo: "lista",
            voci: [
              "periodo di adattamento con possibile fastidio, difficoltà fonetiche e masticatorie iniziali, aumento della salivazione;",
              "zone di compressione e decubiti, che richiedono ritocchi;",
              "progressiva perdita di stabilità per il fisiologico riassorbimento osseo, con necessità di ribasature periodiche o rifacimento;",
              "sollecitazione dei denti di ancoraggio, che nel tempo possono subire mobilità o carie;",
              "possibile frattura della protesi o dei ganci.",
            ],
          },
        ],
      },
      {
        titolo: "5. Conseguenze del mancato trattamento",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "Il mancato trattamento può comportare: frattura o perdita degli elementi compromessi, migrazioni dentali, alterazioni dell'occlusione e della masticazione, sovraccarico degli elementi residui, peggioramento estetico e fonetico, con successive riabilitazioni più complesse e costose.",
          },
        ],
      },
      {
        titolo: "6. Obblighi di mantenimento",
        blocchi: [
          {
            tipo: "lista",
            voci: [
              "igiene orale domiciliare accurata, incluse le tecniche specifiche per manufatti protesici (scovolini, filo con passafilo, pulizia della protesi rimovibile);",
              "controlli periodici e sedute di igiene professionale secondo il programma indicato;",
              "utilizzo del bite notturno, se prescritto;",
              "segnalazione tempestiva di decementazioni, fratture, dolore o instabilità.",
            ],
          },
        ],
      },
      {
        titolo: "Dichiarazione del paziente",
        blocchi: [dichiarazioneStandard("il trattamento protesico sopra indicato")],
      },
    ],
  },

  // 08 — Ortodonzia
  {
    key: "ORTODONZIA",
    numero: 8,
    titolo: "Consenso informato al trattamento ortodontico",
    sottotitolo: "apparecchiature fisse, rimovibili e allineatori trasparenti — ai sensi della Legge 22 dicembre 2017, n. 219",
    tipoConsenso: "binario",
    richiedeMinorenne: true,
    richiedeRevoca: true,
    sezioni: [
      {
        titolo: "1. Trattamento proposto",
        blocchi: [
          {
            tipo: "checkbox",
            items: [
              { id: "fissa", label: "Terapia ortodontica fissa (multibracket)" },
              { id: "allineatori", label: "Terapia con allineatori trasparenti" },
              { id: "intercettiva", label: "Terapia ortodontica intercettiva / apparecchiatura rimovibile o funzionale" },
              { id: "estrazioni_ortodontiche", label: "Estrazioni a fini ortodontici previste", campoLibero: { id: "estrazioni_ortodontiche_elementi", label: "Elementi n." } },
              { id: "dispositivi_ausiliari", label: "Dispositivi ausiliari previsti (miniviti, trazione extraorale, elastici intermascellari)", campoLibero: { id: "dispositivi_ausiliari_dettaglio", label: "Specificare" } },
            ],
          },
          { tipo: "campo", campo: { id: "diagnosi_ortodontica", label: "Diagnosi ortodontica", multilinea: true } },
          { tipo: "campo", campo: { id: "durata_stimata", label: "Durata stimata del trattamento (indicativa)" } },
        ],
      },
      {
        titolo: "2. Descrizione del trattamento",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "Il trattamento ortodontico corregge le malposizioni dentali e/o le anomalie dei rapporti tra le arcate mediante l'applicazione di forze controllate. La diagnosi si basa su esame clinico, fotografie, modelli o scansioni e radiografie. La durata indicata è una stima: la risposta biologica individuale, la crescita e la collaborazione del paziente possono allungare o modificare i tempi. Al termine della fase attiva è indispensabile una fase di contenzione per stabilizzare il risultato.",
          },
        ],
      },
      {
        titolo: "3. Alternative terapeutiche",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "Le alternative dipendono dal caso: diverse tipologie di apparecchiature, compromessi terapeutici con obiettivi più limitati, trattamento ortodontico-chirurgico nei casi scheletrici severi, o il mancato trattamento con le conseguenze indicate al punto 5.",
          },
        ],
      },
      {
        titolo: "4. Rischi, complicanze e limiti del trattamento",
        blocchi: [
          {
            tipo: "lista",
            voci: [
              "fastidio o dolenzia nei giorni successivi alle attivazioni; irritazioni di guance e labbra; difficoltà fonetiche transitorie;",
              "decalcificazioni dello smalto (macchie bianche), carie e infiammazione gengivale in caso di igiene orale inadeguata durante la terapia;",
              "riassorbimento radicolare: un accorciamento lieve delle radici è frequente e generalmente privo di conseguenze; in rari casi può essere marcato e richiedere la modifica o l'interruzione della terapia;",
              "possibile perdita di vitalità di elementi già compromessi da traumi o carie profonde;",
              "problemi all'articolazione temporo-mandibolare: possono manifestarsi durante la terapia, senza che sia dimostrato un rapporto causale diretto;",
              "distacco di attacchi o bande, rottura di fili con possibili piccole lesioni; ingestione o inalazione accidentale di piccole parti (evento eccezionale);",
              "recidiva: i denti tendono naturalmente a muoversi per tutta la vita; senza un uso corretto e protratto della contenzione, il risultato può in parte perdersi;",
              "con allineatori: il risultato dipende in modo determinante dal numero di ore di utilizzo quotidiano (di norma 22 ore/die); un uso insufficiente compromette l'esito;",
              "possibile necessità di ridefinire il piano in corso di trattamento.",
            ],
          },
        ],
      },
      {
        titolo: "5. Conseguenze del mancato trattamento",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "Il mancato trattamento può comportare la persistenza o l'aggravamento della malocclusione: affollamento con maggiore difficoltà di igiene, usura dentale anomala, traumi occlusali, problematiche estetiche e funzionali, maggiore complessità di eventuali future riabilitazioni.",
          },
        ],
      },
      {
        titolo: "6. Obblighi di collaborazione del paziente",
        blocchi: [
          {
            tipo: "lista",
            voci: [
              "igiene orale domiciliare rigorosa e sedute di igiene professionale periodiche durante tutta la terapia;",
              "rispetto degli appuntamenti di controllo e attivazione;",
              "utilizzo di elastici, apparecchi rimovibili o allineatori secondo le ore prescritte;",
              "limitazione di cibi duri, appiccicosi e zuccherati; astensione da abitudini dannose;",
              "utilizzo della contenzione secondo le indicazioni, anche a lungo termine, e partecipazione ai controlli post-trattamento;",
              "segnalazione tempestiva di rotture o distacchi dell'apparecchiatura.",
            ],
          },
          {
            tipo: "paragrafo",
            testo: "La mancata collaborazione del paziente costituisce la principale causa di allungamento dei tempi, risultati parziali o insuccesso della terapia.",
          },
        ],
      },
      {
        titolo: "Dichiarazione del paziente",
        blocchi: [dichiarazioneStandard("il trattamento ortodontico sopra indicato")],
      },
    ],
  },

  // 09 — Parodontologia
  {
    key: "PARODONTOLOGIA",
    numero: 9,
    titolo: "Consenso informato alla terapia parodontale",
    sottotitolo: "terapia non chirurgica, chirurgica e di mantenimento — ai sensi della Legge 22 dicembre 2017, n. 219",
    tipoConsenso: "binario",
    richiedeMinorenne: true,
    richiedeRevoca: true,
    sezioni: [
      {
        titolo: "1. Diagnosi e trattamento proposto",
        blocchi: [
          { tipo: "campo", campo: { id: "diagnosi_parodontale", label: "Diagnosi parodontale (es. parodontite — stadio e grado, gengivite)", multilinea: true } },
          {
            tipo: "checkbox",
            items: [
              { id: "non_chirurgica", label: "Terapia parodontale non chirurgica (strumentazione sopra e sottogengivale / levigatura radicolare)" },
              { id: "rivalutazione", label: "Rivalutazione parodontale a distanza di 6-12 settimane" },
              { id: "chirurgica", label: "Terapia parodontale chirurgica (resettiva / rigenerativa)", campoLibero: { id: "chirurgica_sedi", label: "Sedi" } },
              { id: "mucogengivale", label: "Chirurgia mucogengivale (copertura recessioni, innesti)", campoLibero: { id: "mucogengivale_sedi", label: "Sedi" } },
              { id: "mantenimento", label: "Terapia parodontale di supporto (mantenimento)", campoLibero: { id: "mantenimento_richiamo", label: "Richiamo ogni ... mesi" } },
            ],
          },
        ],
      },
      {
        titolo: "2. Descrizione del trattamento",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "La parodontite è una malattia infettivo-infiammatoria cronica che distrugge i tessuti di sostegno dei denti e rappresenta una delle principali cause di perdita degli elementi dentali. La terapia si articola per fasi: istruzione e motivazione all'igiene domiciliare, strumentazione professionale sopra e sottogengivale in una o più sedute, rivalutazione e, nei siti che non rispondono, eventuale terapia chirurgica. La parodontite è una malattia controllabile ma non guaribile in senso definitivo: il risultato si mantiene solo con una terapia di supporto periodica per tutta la vita.",
          },
        ],
      },
      {
        titolo: "3. Alternative terapeutiche",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "Non esistono alternative efficaci alla rimozione professionale dei depositi batterici associata a un'igiene domiciliare adeguata. L'alternativa al trattamento è la progressione della malattia, con le conseguenze indicate al punto 5. Nei casi avanzati, l'alternativa alla terapia può essere l'estrazione degli elementi compromessi e la successiva riabilitazione.",
          },
        ],
      },
      {
        titolo: "4. Rischi, complicanze e limiti del trattamento",
        blocchi: [
          {
            tipo: "lista",
            voci: [
              "sensibilità dentinale al freddo, transitoria ma talvolta persistente, dopo la strumentazione;",
              "retrazione delle gengive con allungamento apparente dei denti, comparsa di spazi scuri interdentali ed eventuali inestetismi: conseguenza attesa della guarigione, non un danno da trattamento;",
              "mobilità transitoria degli elementi trattati; sanguinamento e fastidio post-operatorio;",
              "dopo chirurgia: gonfiore, ematoma, dolore, esposizione radicolare, esiti estetici non prevedibili con certezza; nelle procedure rigenerative il risultato biologico non è garantibile;",
              "risposta alla terapia ridotta o imprevedibile nei fumatori e nei pazienti con diabete non compensato;",
              "possibile perdita, nonostante la terapia, degli elementi con prognosi già gravemente compromessa;",
              "recidiva della malattia in caso di igiene domiciliare insufficiente o mancata adesione ai richiami di mantenimento.",
            ],
          },
        ],
      },
      {
        titolo: "5. Conseguenze del mancato trattamento",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "La parodontite non trattata progredisce con riassorbimento osseo, mobilità crescente, ascessi, migrazioni dentali e perdita degli elementi. La letteratura scientifica associa inoltre la parodontite non controllata a effetti negativi sulla salute generale (in particolare controllo glicemico nel diabete e rischio cardiovascolare).",
          },
        ],
      },
      {
        titolo: "6. Obblighi di collaborazione del paziente",
        blocchi: [
          {
            tipo: "lista",
            voci: [
              "igiene orale domiciliare quotidiana con le tecniche e gli strumenti indicati (spazzolino, scovolini, filo);",
              "adesione al programma di terapia di supporto (di norma ogni 3-4 mesi nei pazienti parodontali);",
              "riduzione o abbandono del fumo, fortemente raccomandati;",
              "controllo delle patologie sistemiche concomitanti (in particolare diabete) con il proprio medico.",
            ],
          },
          {
            tipo: "paragrafo",
            testo: "La mancata adesione ai richiami di mantenimento è la principale causa documentata di recidiva e perdita di elementi dentali nel paziente parodontale.",
          },
        ],
      },
      {
        titolo: "Dichiarazione del paziente",
        blocchi: [dichiarazioneStandard("la terapia parodontale sopra indicata")],
      },
    ],
  },

  // 10 — Anestesia Locale
  {
    key: "ANESTESIA_LOCALE",
    numero: 10,
    titolo: "Consenso informato all'anestesia locale in odontoiatria",
    sottotitolo: "ai sensi della Legge 22 dicembre 2017, n. 219 — valido per l'intero piano di cura, salvo revoca o variazioni anamnestiche",
    tipoConsenso: "binario",
    richiedeMinorenne: true,
    richiedeRevoca: true,
    sezioni: [
      {
        titolo: "1. Descrizione del trattamento",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "L'anestesia locale consente di eseguire le cure odontoiatriche senza dolore, mediante iniezione di un farmaco anestetico (es. articaina, lidocaina, mepivacaina), di norma associato a un vasocostrittore (adrenalina) che ne prolunga l'effetto e riduce il sanguinamento. Le tecniche impiegate comprendono l'anestesia plessica e l'anestesia tronculare (del nervo alveolare inferiore, per i settori posteriori mandibolari). L'effetto ha durata variabile da una a diverse ore. La scelta del farmaco e della tecnica è effettuata dall'odontoiatra sulla base dell'anamnesi e del tipo di intervento; per questo è indispensabile che la scheda anamnestica sia completa e aggiornata.",
          },
        ],
      },
      {
        titolo: "2. Rischi e complicanze possibili",
        blocchi: [
          {
            tipo: "lista",
            voci: [
              "dolore, bruciore o fastidio nella sede di iniezione; ematoma locale;",
              "reazioni vaso-vagali (pallore, sudorazione, sensazione di svenimento), in genere transitorie e legate all'emotività;",
              "palpitazioni e senso di batticuore di breve durata, legati al vasocostrittore;",
              "limitazione transitoria dell'apertura della bocca (trisma) dopo anestesia tronculare;",
              "morsicatura involontaria di labbra, guance o lingua durante la persistenza dell'effetto anestetico (rischio particolarmente rilevante nei bambini);",
              "alterazioni della sensibilità (parestesie) di labbro, mento o lingua, quasi sempre transitorie; in casi rari possono essere di lunga durata o permanenti;",
              "reazioni allergiche agli anestetici locali o ai loro conservanti: rare, nella maggior parte dei casi lievi, eccezionalmente gravi (reazione anafilattica);",
              "reazioni tossiche da assorbimento sistemico: eccezionali alle dosi utilizzate in odontoiatria;",
              "inefficacia parziale dell'anestesia in presenza di infezione acuta o varianti anatomiche, con necessità di dosi aggiuntive o rinvio della cura.",
            ],
          },
        ],
      },
      {
        titolo: "3. Alternative",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "Non esistono alternative equivalenti all'anestesia locale per il controllo del dolore nella maggior parte delle cure odontoiatriche. Eseguire i trattamenti senza anestesia è possibile solo per procedure minori e comporta dolore; per pazienti particolarmente ansiosi o non collaboranti possono essere valutate tecniche di sedazione, oggetto di consenso separato.",
          },
        ],
      },
      {
        titolo: "4. Raccomandazioni per il paziente",
        blocchi: [
          {
            tipo: "lista",
            voci: [
              "segnalare prima di ogni seduta variazioni di salute, nuovi farmaci, gravidanza o precedenti reazioni ad anestetici;",
              "non assumere cibi fino alla completa scomparsa dell'effetto anestetico, per evitare morsicature (sorvegliare i bambini);",
              "segnalare immediatamente malessere, prurito, difficoltà respiratorie o gonfiore durante o dopo la seduta;",
              "riferire allo studio alterazioni della sensibilità che persistano oltre le ore attese.",
            ],
          },
        ],
      },
      {
        titolo: "Dichiarazione del paziente",
        blocchi: [dichiarazioneStandard("l'anestesia locale necessaria all'esecuzione delle cure odontoiatriche programmate")],
      },
    ],
  },

  // 11 — Pedodonzia (minori)
  {
    key: "PEDODONZIA",
    numero: 11,
    titolo: "Consenso informato alle cure odontoiatriche del paziente minorenne",
    sottotitolo: "pedodonzia — ai sensi dell'art. 3 della Legge 22 dicembre 2017, n. 219 e degli artt. 316 e ss. c.c.",
    tipoConsenso: "pedodonzia",
    richiedeMinorenne: false,
    richiedeRevoca: false,
    richiedeDatiMinore: true,
    sezioni: [
      {
        titolo: "1. Trattamenti proposti",
        blocchi: [
          {
            tipo: "checkbox",
            items: [
              { id: "visita_igiene", label: "Visita, igiene orale professionale e applicazione topica di fluoro" },
              { id: "sigillature", label: "Sigillature dei solchi", campoLibero: { id: "sigillature_elementi", label: "Elementi n." } },
              { id: "otturazioni", label: "Otturazioni su denti decidui e/o permanenti", campoLibero: { id: "otturazioni_elementi", label: "Elementi n." } },
              { id: "terapia_polpa", label: "Terapia della polpa su denti decidui (pulpotomia / pulpectomia)", campoLibero: { id: "terapia_polpa_elementi", label: "Elementi n." } },
              { id: "estrazione_deciduo", label: "Estrazione di denti decidui", campoLibero: { id: "estrazione_deciduo_elementi", label: "Elementi n." } },
              { id: "mantenitore_spazio", label: "Mantenitore di spazio" },
              { id: "radiografie", label: "Radiografie endorali / ortopantomografia, se necessarie ai fini diagnostici" },
              { id: "altro_pedodonzia", label: "Altro", campoLibero: { id: "altro_pedodonzia_dettaglio", label: "Specificare" } },
            ],
          },
        ],
      },
      {
        titolo: "2. Informazioni sulle cure del paziente in età evolutiva",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "La cura dei denti decidui (\"da latte\") è importante: la loro perdita precoce o le infezioni non trattate possono danneggiare i denti permanenti in formazione, compromettere lo spazio in arcata, la masticazione e la fonazione. Le sedute sono condotte con tecniche di approccio comportamentale graduale (es. tell-show-do), adattando tempi e modalità all'età e alla collaborazione del bambino; per questo il piano di cura può richiedere più appuntamenti o essere modulato in corso d'opera. L'anestesia locale, ove necessaria, è oggetto delle informazioni riportate nel relativo modulo.",
          },
        ],
      },
      {
        titolo: "3. Rischi e limiti specifici",
        blocchi: [
          {
            tipo: "lista",
            voci: [
              "collaborazione limitata del bambino: alcune sedute possono dover essere interrotte, rinviate o riprogrammate; nei casi non gestibili in studio può essere proposta la sedazione o l'invio a struttura idonea;",
              "morsicatura di labbra o guance dopo anestesia locale, per il persistere dell'effetto: è necessaria la sorveglianza del genitore fino alla scomparsa dell'anestesia;",
              "possibile insuccesso delle terapie della polpa sui decidui, con successiva necessità di estrazione;",
              "caduta o frattura di otturazioni e sigillature, che richiedono controlli periodici ed eventuali rifacimenti;",
              "esfoliazione naturale dei decidui trattati, che può rendere temporaneo il beneficio delle cure eseguite;",
              "rischi generali delle singole procedure (otturazioni, estrazioni), analoghi a quelli illustrati per il paziente adulto e discussi in sede di colloquio.",
            ],
          },
        ],
      },
      {
        titolo: "4. Conseguenze del mancato trattamento",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "Il mancato trattamento delle patologie diagnosticate può comportare dolore, ascessi e infezioni con possibile danno ai permanenti in formazione, perdita precoce di spazio con future malocclusioni, difficoltà masticatorie e maggiore complessità delle cure successive.",
          },
        ],
      },
      {
        titolo: "5. Obblighi di collaborazione della famiglia",
        blocchi: [
          {
            tipo: "lista",
            voci: [
              "supervisione quotidiana dell'igiene orale del minore e controllo del consumo di zuccheri;",
              "rispetto degli appuntamenti programmati e dei controlli periodici;",
              "sorveglianza del bambino dopo le sedute con anestesia locale;",
              "comunicazione tempestiva di variazioni dello stato di salute e delle terapie farmacologiche del minore.",
            ],
          },
        ],
      },
      {
        titolo: "Dichiarazione e consenso degli esercenti la responsabilità genitoriale",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "I sottoscritti dichiarano di aver ricevuto informazioni chiare e complete su diagnosi, trattamenti proposti, benefici, rischi, alternative e conseguenze del mancato trattamento; di aver potuto porre domande ricevendo risposte esaurienti; di essere consapevoli che la volontà del minore è tenuta in considerazione in relazione alla sua età e maturità (art. 3, L. 219/2017); di poter revocare il consenso in qualsiasi momento.",
          },
        ],
      },
    ],
  },

  // 12 — Dissenso Informato / Rifiuto Cure
  {
    key: "DISSENSO_RIFIUTO",
    numero: 12,
    titolo: "Dichiarazione di rifiuto informato delle cure",
    sottotitolo: "dissenso informato — ai sensi dell'art. 1, commi 5 e 6, della Legge 22 dicembre 2017, n. 219",
    tipoConsenso: "dissenso",
    richiedeMinorenne: true,
    richiedeRevoca: false,
    sezioni: [
      {
        titolo: "1. Trattamento proposto e rifiutato",
        blocchi: [
          { tipo: "campo", campo: { id: "diagnosi", label: "Diagnosi", multilinea: true } },
          { tipo: "campo", campo: { id: "trattamento_proposto", label: "Trattamento/i proposto/i dall'odontoiatra", multilinea: true } },
          {
            tipo: "checkbox",
            items: [
              { id: "rifiuto_totale", label: "Rifiuto totale del trattamento proposto" },
              { id: "rifiuto_parziale", label: "Rifiuto parziale", campoLibero: { id: "rifiuto_parziale_dettaglio", label: "Il paziente rifiuta" } },
              { id: "interruzione", label: "Interruzione di un trattamento già iniziato" },
            ],
          },
          { tipo: "campo", campo: { id: "trattamento_alternativo", label: "Eventuale trattamento alternativo scelto dal paziente (se presente)" } },
        ],
      },
      {
        titolo: "2. Conseguenze illustrate al paziente",
        blocchi: [
          {
            tipo: "campo",
            campo: {
              id: "conseguenze_illustrate",
              label: "L'odontoiatra ha illustrato al paziente le conseguenze prevedibili del rifiuto o dell'interruzione, tra cui in particolare",
              multilinea: true,
            },
          },
          {
            tipo: "paragrafo",
            testo:
              "A titolo generale, il mancato trattamento delle patologie odontoiatriche diagnosticate può comportare: progressione di carie e malattia parodontale, dolore, infezioni e ascessi anche con complicanze sistemiche, perdita di elementi dentali, aggravamento dei costi e della complessità delle cure future.",
          },
        ],
      },
      {
        titolo: "3. Dichiarazione del paziente",
        blocchi: [
          {
            tipo: "lista",
            voci: [
              "dichiaro di aver ricevuto informazioni complete e comprensibili sulla mia condizione clinica, sul trattamento proposto, sulle alternative e sulle conseguenze prevedibili del rifiuto;",
              "dichiaro di aver potuto porre domande e di aver ricevuto risposte esaurienti;",
              "consapevolmente e liberamente RIFIUTO il trattamento sopra indicato, assumendomi ogni conseguenza derivante da tale decisione;",
              "sono consapevole che potrò in qualsiasi momento modificare la presente decisione e richiedere il trattamento, compatibilmente con l'evoluzione clinica nel frattempo intervenuta;",
              "sollevo l'odontoiatra e lo studio da ogni responsabilità per le conseguenze derivanti dal rifiuto qui documentato, fermo restando il diritto a ricevere le altre cure.",
            ],
          },
        ],
      },
      {
        titolo: "Eventuale rifiuto di sottoscrizione",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "Il paziente, pur informato come sopra, rifiuta anche di sottoscrivere la presente dichiarazione. Se ne dà atto in presenza del seguente testimone (art. 1, comma 4, L. 219/2017: la volontà è documentata nelle forme consentite dalle condizioni del paziente):",
          },
          { tipo: "campo", campo: { id: "testimone", label: "Testimone (Cognome, Nome, qualifica)" } },
        ],
      },
    ],
  },

  // 13 — Sbiancamento
  {
    key: "SBIANCAMENTO",
    numero: 13,
    titolo: "Consenso informato allo sbiancamento dentale",
    sottotitolo: "professionale in studio e/o domiciliare con mascherine — ai sensi della Legge 219/2017 e del Reg. (CE) 1223/2009",
    tipoConsenso: "binario",
    richiedeMinorenne: false,
    richiedeRevoca: true,
    sezioni: [
      {
        titolo: "1. Trattamento proposto",
        blocchi: [
          {
            tipo: "checkbox",
            items: [
              { id: "studio", label: "Sbiancamento professionale in studio", campoLibero: { id: "studio_sedute", label: "N. sedute previste" } },
              { id: "domiciliare", label: "Sbiancamento domiciliare con mascherine individuali", campoLibero: { id: "domiciliare_durata", label: "Durata prevista" } },
              { id: "combinato", label: "Trattamento combinato (studio + domiciliare)" },
              { id: "interno", label: "Sbiancamento del dente singolo devitalizzato (tecnica interna)", campoLibero: { id: "interno_elemento", label: "Elemento n." } },
            ],
          },
          { tipo: "campo", campo: { id: "prodotto_concentrazione", label: "Prodotto e concentrazione utilizzati" } },
        ],
      },
      {
        titolo: "2. Descrizione del trattamento e quadro normativo",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "Lo sbiancamento dentale schiarisce il colore dei denti mediante gel a base di perossido di idrogeno o di carbammide. Ai sensi della normativa europea sui prodotti cosmetici, i prodotti contenenti perossido di idrogeno tra 0,1% e 6% possono essere utilizzati solo previa visita odontoiatrica, con primo ciclo di applicazione eseguito dall'odontoiatra o sotto la sua diretta supervisione, e non possono essere impiegati su pazienti di età inferiore a 18 anni. Prima del trattamento è necessaria la valutazione clinica di carie, restauri infiltrati, lesioni cervicali e stato gengivale.",
          },
        ],
      },
      {
        titolo: "3. Alternative terapeutiche",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "Igiene professionale con rimozione delle pigmentazioni superficiali; restauri estetici (faccette, corone) nei casi di discromie non responsive; nessun trattamento, trattandosi di procedura elettiva a finalità estetica.",
          },
        ],
      },
      {
        titolo: "4. Rischi, limiti e complicanze",
        blocchi: [
          {
            tipo: "lista",
            voci: [
              "sensibilità dentale al freddo durante e dopo il trattamento: frequente, in genere transitoria (ore o giorni);",
              "irritazione gengivale o delle mucose per contatto con il gel, in genere reversibile;",
              "risultato non garantibile né prevedibile con esattezza: la risposta dipende dalla natura della discromia (le pigmentazioni da tetracicline e le discromie grigie rispondono poco);",
              "otturazioni, corone e faccette NON si schiariscono: dopo lo sbiancamento potrebbero risultare visibilmente più scure e richiedere la sostituzione a spese del paziente;",
              "recidiva del colore nel tempo (mesi o anni), influenzata da fumo, caffè, tè, vino rosso e pigmenti alimentari; possibili richiami periodici;",
              "nello sbiancamento domiciliare il risultato dipende dalla costanza di utilizzo delle mascherine secondo le istruzioni;",
              "nello sbiancamento interno del dente devitalizzato: possibile riassorbimento cervicale della radice (raro), risultato parziale o recidiva;",
              "controindicazioni: gravidanza e allattamento (in via prudenziale), minori di 18 anni, patologie del cavo orale non trattate.",
            ],
          },
        ],
      },
      {
        titolo: "5. Raccomandazioni",
        blocchi: [
          {
            tipo: "lista",
            voci: [
              "nei giorni successivi alle sedute, limitare cibi e bevande pigmentanti e il fumo (\"dieta bianca\" per 48 ore);",
              "utilizzare i prodotti desensibilizzanti eventualmente prescritti;",
              "seguire scrupolosamente tempi e modalità d'uso delle mascherine domiciliari, senza superare le dosi indicate;",
              "sospendere l'applicazione e contattare lo studio in caso di sensibilità intensa o irritazione delle gengive.",
            ],
          },
        ],
      },
      {
        titolo: "Dichiarazione del paziente",
        blocchi: [dichiarazioneStandard("il trattamento di sbiancamento dentale sopra indicato, di natura elettiva ed estetica")],
      },
    ],
  },

  // 14 — Sedazione Protossido
  {
    key: "SEDAZIONE_PROTOSSIDO",
    numero: 14,
    titolo: "Consenso informato alla sedazione cosciente con protossido d'azoto",
    sottotitolo: "analgesia sedativa inalatoria con miscela protossido d'azoto/ossigeno — ai sensi della Legge 219/2017",
    tipoConsenso: "binario",
    richiedeMinorenne: true,
    richiedeRevoca: true,
    sezioni: [
      {
        titolo: "1. Descrizione del trattamento",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "La sedazione cosciente inalatoria consiste nella somministrazione, attraverso una mascherina nasale, di una miscela di protossido d'azoto e ossigeno, titolata individualmente dall'odontoiatra. Induce uno stato di rilassamento e riduzione dell'ansia mantenendo il paziente cosciente, collaborante e con i riflessi protettivi integri. Non sostituisce l'anestesia locale, che resta necessaria per il controllo del dolore. Al termine della seduta viene somministrato ossigeno puro per alcuni minuti; l'effetto si esaurisce rapidamente e in modo pressoché completo. La tecnica è particolarmente indicata per pazienti ansiosi o fobici, con riflesso del vomito accentuato, e in pedodonzia.",
          },
        ],
      },
      {
        titolo: "2. Controindicazioni — da segnalare prima della seduta",
        blocchi: [
          {
            tipo: "lista",
            voci: [
              "ostruzione nasale o respiratoria (raffreddore, sinusite acuta) e impossibilità di respirare con il naso;",
              "broncopneumopatia cronica ostruttiva severa e insufficienza respiratoria;",
              "primo trimestre di gravidanza;",
              "recenti interventi all'orecchio medio o all'occhio con impiego di gas, pneumotorace, occlusione intestinale;",
              "carenza nota di vitamina B12 o alterazioni del suo metabolismo;",
              "gravi disturbi psichiatrici, stato di intossicazione da alcol o sostanze;",
              "scarsa collaborazione tale da impedire il mantenimento della mascherina nasale.",
            ],
          },
        ],
      },
      {
        titolo: "3. Rischi ed effetti collaterali",
        blocchi: [
          {
            tipo: "lista",
            voci: [
              "nausea e, raramente, vomito (più frequenti dopo pasti abbondanti: si raccomanda un pasto leggero nelle 2-3 ore precedenti);",
              "vertigini, cefalea, sudorazione, sensazione di formicolio, sonnolenza transitoria;",
              "eccitazione paradossa o disforia (raro), che comporta l'interruzione della somministrazione;",
              "efficacia variabile individuale: in una quota di pazienti l'effetto ansiolitico può risultare insufficiente;",
              "la tecnica presenta un profilo di sicurezza elevato; gli effetti si risolvono in pochi minuti dalla sospensione con ossigenazione finale.",
            ],
          },
        ],
      },
      {
        titolo: "4. Alternative",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "Trattamento senza sedazione con sole tecniche comportamentali; premedicazione farmacologica ansiolitica per via orale; sedazione endovenosa o anestesia generale in ambiente idoneo, per i casi non gestibili in studio.",
          },
        ],
      },
      {
        titolo: "5. Raccomandazioni post-seduta",
        blocchi: [
          {
            tipo: "lista",
            voci: [
              "attendere in studio fino al completo recupero, valutato dall'odontoiatra;",
              "per i pazienti adulti è prudente evitare la guida di veicoli nelle ore immediatamente successive se residuano sonnolenza o vertigini; per i minori è richiesto l'accompagnamento;",
              "segnalare allo studio eventuali disturbi persistenti dopo la seduta.",
            ],
          },
        ],
      },
      {
        titolo: "Dichiarazione del paziente",
        blocchi: [dichiarazioneStandard("la sedazione cosciente inalatoria con protossido d'azoto/ossigeno, in associazione alle cure programmate")],
      },
    ],
  },

  // 15 — Liberatoria Foto/Video
  {
    key: "LIBERATORIA_FOTO_VIDEO",
    numero: 15,
    titolo: "Consenso e liberatoria per fotografie e riprese video",
    sottotitolo: "ai sensi degli artt. 6 e 9 GDPR, dell'art. 10 c.c. e degli artt. 96-97 della Legge 633/1941",
    tipoConsenso: "multiplo",
    consensoMultiploVoci: [
      { id: "clinica", label: "Acquisizione di fotografie/video clinici a fini di documentazione sanitaria (parte integrante della cura)" },
      { id: "anonima", label: "Utilizzo di immagini in forma ANONIMA per finalità scientifiche, didattiche e congressuali" },
      { id: "sito_web", label: "Pubblicazione di immagini RICONOSCIBILI sul sito web dello studio" },
      { id: "social", label: "Pubblicazione di immagini RICONOSCIBILI sui profili social dello studio (Instagram, Facebook)" },
      { id: "materiale_cartaceo", label: "Utilizzo di immagini RICONOSCIBILI su materiale informativo/promozionale cartaceo dello studio" },
    ],
    richiedeMinorenne: true,
    richiedeRevoca: false,
    sezioni: [
      {
        titolo: "1. Finalità della documentazione fotografica e video",
        blocchi: [
          {
            tipo: "lista",
            voci: [
              "a) Documentazione clinica: fotografie e video acquisiti a fini diagnostici, di pianificazione, di comunicazione con il laboratorio e di documentazione del trattamento. Rientrano nella finalità di cura e sono conservati nella documentazione sanitaria del paziente;",
              "b) Finalità scientifiche e didattiche in forma anonima: utilizzo di immagini prive di elementi identificativi in corsi, congressi, pubblicazioni;",
              "c) Finalità divulgative e promozionali con paziente riconoscibile: pubblicazione di immagini del volto o comunque identificabili sui canali dello studio, casi clinici \"prima e dopo\" riconoscibili.",
            ],
          },
        ],
      },
      {
        titolo: "2. Condizioni per l'utilizzo con paziente riconoscibile",
        blocchi: [
          {
            tipo: "lista",
            voci: [
              "il consenso è libero, facoltativo e specifico per ciascun canale: il rifiuto non incide in alcun modo sull'accesso alle cure;",
              "l'utilizzo avviene a titolo gratuito, senza corrispettivo presente o futuro, in contesti decorosi e non lesivi della dignità della persona;",
              "le immagini non saranno cedute a terzi per finalità diverse da quelle autorizzate;",
              "il consenso è revocabile in qualsiasi momento con comunicazione scritta allo studio; la revoca comporta la rimozione delle immagini dai canali gestiti dallo studio entro un termine ragionevole, ferma restando l'impossibilità tecnica di eliminare copie già diffuse da terzi;",
              "il paziente ha diritto di visionare in anteprima le immagini destinate alla pubblicazione, su richiesta.",
            ],
          },
        ],
      },
      {
        titolo: "4. Durata e conservazione",
        blocchi: [
          { tipo: "campo", campo: { id: "durata_consenso", label: "Il consenso alle finalità c), d), e) è valido fino a revoca ovvero fino al" } },
          {
            tipo: "paragrafo",
            testo:
              "Le immagini di documentazione clinica sono conservate con la documentazione sanitaria; le immagini pubblicate sono rimosse in caso di revoca secondo quanto indicato al punto 2.",
          },
        ],
      },
    ],
  },

  // 16 — Gnatologia / Bite
  {
    key: "GNATOLOGIA_BITE",
    numero: 16,
    titolo: "Consenso informato alla terapia gnatologica con dispositivo occlusale (bite)",
    sottotitolo: "ai sensi della Legge 219/2017 — dispositivo medico su misura ex Regolamento (UE) 2017/745",
    tipoConsenso: "binario",
    richiedeMinorenne: true,
    richiedeRevoca: true,
    sezioni: [
      {
        titolo: "1. Diagnosi e trattamento proposto",
        blocchi: [
          {
            tipo: "campo",
            campo: { id: "diagnosi_gnatologica", label: "Diagnosi (bruxismo/serramento, disordine temporo-mandibolare, dolore miofasciale, altro)", multilinea: true },
          },
          {
            tipo: "checkbox",
            items: [
              { id: "svincolo", label: "Bite di svincolo / placca di stabilizzazione (superiore / inferiore)" },
              { id: "protezione_notturna", label: "Bite di protezione notturna per bruxismo" },
              { id: "altro_dispositivo", label: "Altro dispositivo", campoLibero: { id: "altro_dispositivo_dettaglio", label: "Specificare" } },
            ],
          },
          { tipo: "campo", campo: { id: "modalita_uso", label: "Modalità d'uso prescritta (ore, notturno/diurno)" } },
        ],
      },
      {
        titolo: "2. Descrizione del trattamento",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "Il dispositivo occlusale (bite) è una placca rimovibile in resina, realizzata su misura da laboratorio odontotecnico sulla base di impronte o scansioni, che si interpone tra le arcate dentarie. Le sue finalità principali sono: proteggere i denti e i restauri dall'usura da bruxismo, ridurre il sovraccarico muscolare e articolare, contribuire al controllo dei sintomi dei disordini temporo-mandibolari (DTM). Il trattamento richiede controlli periodici per la verifica e la regolazione dei contatti occlusali. I DTM hanno natura multifattoriale: il bite è un presidio sintomatico e protettivo, non una cura risolutiva della causa, e può essere affiancato da consigli comportamentali, fisioterapia o altre terapie.",
          },
        ],
      },
      {
        titolo: "3. Alternative terapeutiche",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "Terapia comportamentale e auto-gestione (consapevolezza delle parafunzioni, igiene del sonno, gestione dello stress); fisioterapia e terapia manuale; terapia farmacologica sintomatica su prescrizione; nessun trattamento, con monitoraggio dell'usura e dei sintomi.",
          },
        ],
      },
      {
        titolo: "4. Rischi, limiti e complicanze",
        blocchi: [
          {
            tipo: "lista",
            voci: [
              "risultato non garantibile: la risposta dei sintomi (dolore, rumori articolari, cefalea) è variabile e in alcuni pazienti parziale o assente;",
              "fastidio iniziale, aumento della salivazione, transitorie difficoltà fonetiche; periodo di adattamento di alcuni giorni;",
              "possibile transitorio incremento del serramento nelle prime fasi;",
              "uso scorretto o dispositivi non controllati possono determinare spostamenti dentali e modifiche occlusali anche permanenti: per questo sono indispensabili i controlli programmati;",
              "usura, frattura o deformazione del dispositivo nel tempo, con necessità di ritocchi, ribasature o rifacimento;",
              "il dispositivo è un ausilio individuale: non deve essere utilizzato da altri né modificato autonomamente.",
            ],
          },
        ],
      },
      {
        titolo: "5. Conseguenze del mancato trattamento",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "In presenza di bruxismo non protetto: usura progressiva di smalto e restauri, fratture dentali, sensibilità, possibile aggravamento della sintomatologia muscolo-articolare. Nei DTM, l'evoluzione è variabile e non sempre prevedibile.",
          },
        ],
      },
      {
        titolo: "6. Obblighi del paziente",
        blocchi: [
          {
            tipo: "lista",
            voci: [
              "utilizzare il dispositivo secondo le ore e le modalità prescritte;",
              "presentarsi ai controlli periodici di verifica e regolazione;",
              "pulire quotidianamente il dispositivo con spazzolino e prodotti idonei (non acqua calda), conservandolo nell'apposito contenitore;",
              "sospendere l'uso e contattare lo studio in caso di dolore in aumento, mobilità dentale o alterazioni del combaciamento.",
            ],
          },
          {
            tipo: "paragrafo",
            testo: "Il dispositivo è realizzato su misura ed è accompagnato dalla documentazione prevista dal Regolamento (UE) 2017/745 per i dispositivi su misura.",
          },
        ],
      },
      {
        titolo: "Dichiarazione del paziente",
        blocchi: [dichiarazioneStandard("la terapia gnatologica con dispositivo occlusale sopra indicata")],
      },
    ],
  },

  // 17 — Faccette Estetiche
  {
    key: "FACCETTE_ESTETICA",
    numero: 17,
    titolo: "Consenso informato al trattamento con faccette estetiche",
    sottotitolo: "faccette in ceramica/disilicato e restauri estetici adesivi — ai sensi della Legge 219/2017",
    tipoConsenso: "binario",
    richiedeMinorenne: false,
    richiedeRevoca: true,
    sezioni: [
      {
        titolo: "1. Trattamento proposto",
        blocchi: [
          { tipo: "campo", campo: { id: "elementi_da_trattare", label: "Elementi da trattare (n.)" } },
          {
            tipo: "checkbox",
            items: [
              { id: "ceramica", label: "Faccette in ceramica / disilicato di litio" },
              { id: "composito", label: "Faccette/restauri in composito (tecnica diretta o indiretta)" },
              { id: "no_prep", label: "Preparazione minimale o \"no-prep\" (ove le condizioni cliniche lo consentano)" },
              { id: "mock_up", label: "Mock-up / prova estetica preliminare prevista" },
            ],
          },
          {
            tipo: "campo",
            campo: { id: "trattamenti_propedeutici", label: "Eventuali trattamenti propedeutici (sbiancamento, ortodonzia pre-protesica, terapia parodontale)" },
          },
        ],
      },
      {
        titolo: "2. Descrizione del trattamento",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "Le faccette sono sottili restauri che ricoprono la superficie visibile dei denti anteriori per correggerne forma, colore, dimensioni o piccole malposizioni. Il trattamento prevede: pianificazione estetica (fotografie, ceratura diagnostica ed eventuale mock-up di prova), preparazione dei denti — che nella maggior parte dei casi comporta la rimozione irreversibile di una quota di smalto —, impronte o scansioni, faccette provvisorie e cementazione adesiva dei manufatti definitivi realizzati dal laboratorio (dispositivi su misura ex Reg. UE 2017/745). Il colore e la forma definitivi vengono concordati prima della cementazione: dopo la cementazione il colore non è più modificabile.",
          },
        ],
      },
      {
        titolo: "3. Alternative terapeutiche",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "Sbiancamento dentale (per le sole discromie); restauri diretti in composito (meno invasivi, più soggetti a pigmentazione e usura); trattamento ortodontico (per le malposizioni); corone complete (più invasive); nessun trattamento, trattandosi di procedura prevalentemente elettiva ed estetica.",
          },
        ],
      },
      {
        titolo: "4. Rischi, limiti e complicanze",
        blocchi: [
          {
            tipo: "lista",
            voci: [
              "irreversibilità: il dente preparato dovrà essere sempre protetto da un restauro; non è possibile tornare alla situazione originaria;",
              "sensibilità post-operatoria, in genere transitoria; in una percentuale limitata di casi la preparazione può evolvere in infiammazione pulpare con necessità di devitalizzazione, anche a distanza di tempo;",
              "distacco (decementazione), scheggiatura o frattura della faccetta, con necessità di ricementazione o rifacimento;",
              "infiltrazione o pigmentazione dei margini nel tempo; recessioni gengivali con esposizione del margine;",
              "risultato estetico: pur con la pianificazione e il mock-up, la percezione soggettiva del risultato può differire dalle aspettative; il colore definitivo non è modificabile dopo la cementazione;",
              "durata limitata nel tempo: ogni restauro estetico è soggetto a invecchiamento e potrà richiedere sostituzione, con costi a carico del paziente;",
              "bruxismo e parafunzioni aumentano significativamente il rischio di frattura: è prescritto l'uso del bite notturno di protezione, condizione anche per l'eventuale garanzia sul manufatto;",
              "nei restauri in composito: maggiore tendenza a pigmentarsi e usurarsi, necessità di lucidature periodiche.",
            ],
          },
        ],
      },
      {
        titolo: "5. Conseguenze del mancato trattamento",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "Trattandosi di trattamento in prevalenza elettivo, il mancato trattamento comporta la persistenza della situazione estetica attuale; ove presenti difetti di struttura (fratture, erosioni, usure), la loro possibile progressione.",
          },
        ],
      },
      {
        titolo: "6. Obblighi del paziente",
        blocchi: [
          {
            tipo: "lista",
            voci: [
              "approvare espressamente forma e colore in fase di prova, prima della cementazione definitiva;",
              "igiene orale accurata e controlli/igiene professionale periodici;",
              "utilizzo del bite notturno, se prescritto;",
              "evitare abitudini a rischio (mordere oggetti duri, unghie, ghiaccio; usare i denti come \"strumento\");",
              "segnalare tempestivamente distacchi, fratture o sensibilità persistente.",
            ],
          },
        ],
      },
      {
        titolo: "Dichiarazione del paziente",
        blocchi: [dichiarazioneStandard("il trattamento con faccette estetiche sopra indicato, comprensivo della preparazione irreversibile degli elementi ove prevista")],
      },
    ],
  },

  // 18 — MRONJ / Antiriassorbitivi
  {
    key: "MRONJ_ANTIRIASSORBITIVI",
    numero: 18,
    titolo: "Consenso informato per pazienti in terapia con farmaci antiriassorbitivi o antiangiogenetici",
    sottotitolo: "rischio di osteonecrosi dei mascellari farmaco-relata (MRONJ) — in coerenza con le raccomandazioni SIPMO-SICMF",
    tipoConsenso: "binario",
    richiedeMinorenne: true,
    richiedeRevoca: true,
    sezioni: [
      {
        titolo: "1. Terapia farmacologica del paziente",
        blocchi: [
          {
            tipo: "checkbox",
            items: [
              { id: "bifosfonati_orale", label: "Bifosfonati per via ORALE (es. alendronato, risedronato)", campoLibero: { id: "bifosfonati_orale_dal", label: "Dal" } },
              { id: "bifosfonati_ev", label: "Bifosfonati per via ENDOVENOSA (es. zoledronato)", campoLibero: { id: "bifosfonati_ev_dal", label: "Dal" } },
              { id: "denosumab", label: "Denosumab", campoLibero: { id: "denosumab_dettaglio", label: "Dal / ultima somministrazione" } },
              { id: "antiangiogenetici", label: "Farmaci antiangiogenetici / a bersaglio molecolare", campoLibero: { id: "antiangiogenetici_dettaglio", label: "Specificare" } },
              { id: "terapia_sospesa", label: "Terapia SOSPESA", campoLibero: { id: "terapia_sospesa_data", label: "Data di sospensione" } },
            ],
          },
          { tipo: "campo", campo: { id: "patologia_farmaco", label: "Patologia per cui il farmaco è assunto (osteoporosi, neoplasia con metastasi ossee, altro)" } },
          { tipo: "campo", campo: { id: "medico_prescrittore", label: "Medico prescrittore / specialista di riferimento (nome e recapito)" } },
        ],
      },
      {
        titolo: "2. Trattamento odontoiatrico proposto",
        blocchi: [
          {
            tipo: "checkbox",
            items: [
              { id: "estrazione_mronj", label: "Estrazione dentaria / chirurgia orale", campoLibero: { id: "estrazione_mronj_sede", label: "Elementi/sede" } },
              { id: "implantologia_mronj", label: "Implantologia", campoLibero: { id: "implantologia_mronj_sede", label: "Sede" } },
              { id: "parodontale_mronj", label: "Chirurgia parodontale", campoLibero: { id: "parodontale_mronj_sede", label: "Sede" } },
              { id: "altro_mronj", label: "Altro trattamento invasivo", campoLibero: { id: "altro_mronj_dettaglio", label: "Specificare" } },
            ],
          },
          {
            tipo: "paragrafo",
            testo: "Per il trattamento specifico si rinvia anche al relativo consenso informato dedicato, che il paziente sottoscrive unitamente al presente modulo.",
          },
        ],
      },
      {
        titolo: "3. Che cos'è la MRONJ",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "L'osteonecrosi dei mascellari farmaco-relata (MRONJ) è una reazione avversa caratterizzata dalla progressiva distruzione di tessuto osseo mandibolare o mascellare, che può manifestarsi in pazienti trattati con farmaci antiriassorbitivi o antiangiogenetici, in assenza di precedente radioterapia sul distretto. Può presentarsi con esposizione di osso, dolore, gonfiore, secrezione, mobilità dentale o fistole, anche a distanza di tempo dall'intervento. Gli interventi che coinvolgono l'osso rappresentano il principale fattore scatenante locale, ma la MRONJ può insorgere anche spontaneamente.",
          },
        ],
      },
      {
        titolo: "4. Livello di rischio individuale",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "Il rischio dipende da: tipo di farmaco, via di somministrazione, durata della terapia, patologia di base (più elevato nei pazienti oncologici trattati per via endovenosa rispetto ai pazienti osteoporotici in terapia orale), terapie concomitanti, fumo, diabete, igiene orale e stato parodontale. Il rischio individuale stimato e le relative implicazioni sono stati discussi durante il colloquio.",
          },
          { tipo: "campo", campo: { id: "profilo_rischio", label: "Profilo di rischio valutato (basso / medio / alto) e note", multilinea: true } },
        ],
      },
      {
        titolo: "5. Misure di precauzione adottate",
        blocchi: [
          {
            tipo: "lista",
            voci: [
              "valutazione preliminare, anche radiografica, dello stato dentale e parodontale;",
              "raccordo, ove indicato, con il medico prescrittore in merito alla gestione della terapia farmacologica (l'eventuale sospensione temporanea è di esclusiva competenza del medico prescrittore e non elimina il rischio);",
              "tecnica chirurgica il meno traumatica possibile, con eventuale chiusura per prima intenzione della ferita;",
              "profilassi/terapia antibiotica e sciacqui antisettici secondo i protocolli in uso;",
              "controlli post-operatori programmati fino a completa guarigione della mucosa.",
            ],
          },
        ],
      },
      {
        titolo: "6. Rischi e limiti",
        blocchi: [
          {
            tipo: "lista",
            voci: [
              "nonostante tutte le precauzioni, non è possibile azzerare il rischio di MRONJ, che può insorgere anche a distanza di mesi dall'intervento;",
              "la MRONJ può richiedere terapie mediche prolungate e, nei casi avanzati, interventi chirurgici anche demolitivi;",
              "restano validi tutti i rischi propri del trattamento odontoiatrico specifico, illustrati nel relativo consenso dedicato.",
            ],
          },
        ],
      },
      {
        titolo: "7. Alternative e conseguenze del mancato trattamento",
        blocchi: [
          {
            tipo: "paragrafo",
            testo:
              "Ove clinicamente possibile, sono state valutate alternative meno invasive (terapie conservative, endodontiche o parodontali non chirurgiche, mantenimento dell'elemento). Va tuttavia considerato che NON trattare un'infezione dentale o parodontale attiva costituisce a sua volta un fattore di rischio per MRONJ e per complicanze infettive: in molti casi l'intervento proposto riduce il rischio complessivo rispetto al mantenimento di un focolaio infettivo.",
          },
        ],
      },
      {
        titolo: "8. Obblighi del paziente",
        blocchi: [
          {
            tipo: "lista",
            voci: [
              "mantenere un'igiene orale scrupolosa e presentarsi a controlli e richiami periodici ravvicinati;",
              "astenersi dal fumo, fortemente raccomandato;",
              "segnalare immediatamente allo studio: dolore persistente, gonfiore, esposizione di osso, secrezione, intorpidimento o mancata guarigione della ferita;",
              "informare lo studio di ogni variazione della terapia farmacologica e informare sempre ogni altro odontoiatra della terapia in corso o pregressa;",
              "non sospendere né modificare autonomamente la terapia farmacologica.",
            ],
          },
        ],
      },
      {
        titolo: "Dichiarazione del paziente",
        blocchi: [
          dichiarazioneStandard(
            "il trattamento odontoiatrico sopra indicato, nella piena consapevolezza del rischio di osteonecrosi dei mascellari (MRONJ) connesso alla terapia farmacologica in corso o pregressa"
          ),
        ],
      },
    ],
  },
];

export function getTemplate(key: string): ModuloTemplate | undefined {
  return MODULO_TEMPLATES.find((t) => t.key === key);
}
