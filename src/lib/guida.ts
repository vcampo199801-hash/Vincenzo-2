import type { ModuleKey } from "@/lib/modules";

export type VoceGuida = {
  key: ModuleKey;
  icona: string;
  titolo: string;
  intro: string;
  passi: string[];
};

export const GUIDA: VoceGuida[] = [
  {
    key: "dashboard",
    icona: "📊",
    titolo: "Dashboard",
    intro: "La prima pagina che vedi: la fotografia dello studio in un colpo d'occhio.",
    passi: [
      "I 4 numeri in alto (In regola, In scadenza, Scaduti, Da compilare) contano tutte le voci di Scadenzario, Farmaci e Magazzino insieme.",
      "\"Le tue prossime 5 scadenze\" mostra cosa richiede attenzione a breve: clicca una voce per aprirla.",
      "Il Bilancio dell'attività confronta ricavi (da KPI Studio) e costi stimati (spese, personale, laboratori) — cambia periodo con i pulsanti Annuale/Mensile/Personalizzato.",
      "Puoi trascinare le card della dashboard per riordinarle come preferisci — resta salvato per i prossimi accessi.",
    ],
  },
  {
    key: "scadenzario",
    icona: "🗓️",
    titolo: "Scadenzario",
    intro: "I 24 adempimenti normativi standard dello studio (estintori, autoclave, messa a terra, sorveglianza sanitaria, ecc.), già pronti all'attivazione.",
    passi: [
      "Ogni voce ha una cadenza (es. ogni 12 mesi) e una data dell'ultimo controllo: l'app calcola da sola quando scade.",
      "Quando fai il controllo, apri la voce e usa \"Segna eseguito\" — la data si aggiorna e la prossima scadenza si ricalcola automaticamente.",
      "I colori dicono lo stato: verde in regola, giallo in scadenza, rosso scaduto.",
      "Se non vuoi più ricevere il promemoria via email per una voce specifica, apri la scheda e spunta \"Silenzia i promemoria\".",
    ],
  },
  {
    key: "controlli",
    icona: "🛠️",
    titolo: "Registro controlli",
    intro: "Lo storico dettagliato degli interventi tecnici fatti sullo studio, con i relativi costi.",
    passi: [
      "Aggiungi un controllo con data, descrizione e costo: resta a registro anche dopo che è passato.",
      "Utile in caso di ispezione ASL, per dimostrare la diligenza dello studio nel tempo.",
      "I costi qui inseriti confluiscono anche nel Bilancio dell'attività in Dashboard.",
    ],
  },
  {
    key: "ecm",
    icona: "🎓",
    titolo: "Formazione ECM",
    intro: "I crediti ECM del team, tracciati per il triennio in corso.",
    passi: [
      "Per ogni componente del team, aggiungi i corsi seguiti con i relativi crediti.",
      "L'app somma i crediti e mostra l'avanzamento verso il target del triennio.",
      "Utile per sapere in anticipo chi deve ancora completare la formazione obbligatoria.",
    ],
  },
  {
    key: "documenti",
    icona: "📁",
    titolo: "Documenti",
    intro: "Checklist dei documenti obbligatori dello studio (es. DVR, planimetrie, autorizzazioni).",
    passi: [
      "Ogni documento ha uno stato: presente, da rinnovare, mancante — le righe si colorano di conseguenza.",
      "La percentuale di completezza dell'archivio si vede subito in cima alla pagina.",
      "Serve come promemoria di cosa manca, non come archivio file: i documenti veri restano dove li conservi già (PC, cartelle fisiche, ecc.).",
    ],
  },
  {
    key: "magazzino",
    icona: "📦",
    titolo: "Magazzino",
    intro: "Scorte e scadenze lotti dei materiali di consumo dello studio.",
    passi: [
      "Per ogni articolo imposti una scorta minima: quando la quantità scende sotto, l'app te lo segnala.",
      "Usa le frecce accanto alla quantità per aggiornarla rapidamente dopo un utilizzo o un riordino, senza aprire la scheda.",
      "Puoi scansionare il codice a barre (con lettore esterno o fotocamera del telefono) invece di scrivere a mano nome e scadenza — se il codice è già stato usato in passato, l'app suggerisce da sola i dati.",
      "La scadenza del lotto è quella che genera l'avviso \"in scadenza\"/\"scaduto\", non la scorta.",
    ],
  },
  {
    key: "farmaci",
    icona: "💊",
    titolo: "Farmaci emergenza",
    intro: "Il registro del carrello/kit di emergenza, con i relativi controlli periodici.",
    passi: [
      "Ogni farmaco/presidio ha una scadenza: l'avviso arriva 90 giorni prima, prima che nel resto dell'app.",
      "Nella tabella \"Registro controlli mensili\" spunta la casella quando fai la verifica del mese — resta uno storico di quando è stata fatta.",
      "Anche qui puoi scansionare il codice a barre per compilare velocemente nome e scadenza.",
    ],
  },
  {
    key: "fornitori",
    icona: "📇",
    titolo: "Fornitori",
    intro: "La rubrica dei fornitori di materiali e dei referenti per la compliance.",
    passi: [
      "Inserisci nome, contatti e cosa fornisce ciascuno: da qui in poi comparirà come suggerimento quando aggiungi articoli in Magazzino o Farmaci.",
      "Utile per sapere subito chi chiamare per un riordino urgente.",
    ],
  },
  {
    key: "report",
    icona: "📋",
    titolo: "Report ispezione",
    intro: "Un report stampabile con lo stato di tutte le scadenze dello studio, pronto per un controllo ASL.",
    passi: [
      "Apri la pagina, controlla che i dati siano aggiornati, poi usa il pulsante di stampa del browser (o \"Salva come PDF\").",
      "Mostra in automatico lo stato di ogni voce di Scadenzario, Farmaci e Magazzino al momento in cui lo generi.",
    ],
  },
  {
    key: "kpi",
    icona: "📈",
    titolo: "KPI Studio",
    intro: "I numeri chiave dell'attività clinica: fatturato, prime visite, appuntamenti, preventivi.",
    passi: [
      "Inserisci i dati giorno per giorno (anche a fine settimana insieme, se preferisci recuperare più giorni assieme).",
      "L'app costruisce da sola grafici e resoconti settimanali, mensili e annuali.",
      "Il fatturato inserito qui è anche quello che alimenta il Bilancio dell'attività in Dashboard.",
    ],
  },
  {
    key: "personale",
    icona: "👥",
    titolo: "Personale",
    intro: "Anagrafica dei dipendenti, assenze e archivio cedolini — riservato al titolare dello studio.",
    passi: [
      "Solo il titolare (OWNER) può aprire questo modulo, anche se un collaboratore ha accesso a tutto il resto: contiene dati sanitari sensibili (idoneità, vaccinazioni, malattie).",
      "Per ogni dipendente trovi 3 schede: dati anagrafici, assenze (calendario annuale), e adempimenti/allegati.",
      "Gli allegati caricati (es. certificati) sono cifrati automaticamente.",
      "Puoi esportare il \"Fascicolo dipendente\" completo in PDF.",
    ],
  },
  {
    key: "laboratori",
    icona: "🦷",
    titolo: "Laboratori",
    intro: "Il registro delle lavorazioni odontotecniche esterne e la conformità dei dispositivi su misura.",
    passi: [
      "Prima registra i laboratori con cui collabori, poi apri \"Registro lavorazioni\" per tracciare ogni lavoro inviato/ricevuto.",
      "Ogni lavorazione ha uno stato (inviata, in corso, ricevuta) e può generare la dichiarazione di conformità richiesta dal Regolamento UE 2017/745.",
    ],
  },
  {
    key: "comunicazione",
    icona: "🎬",
    titolo: "Comunicazione Pazienti",
    intro: "Materiali informativi pronti da mostrare in studio o condividere con un link prima dell'appuntamento.",
    passi: [
      "Scegli o carica un materiale, poi genera un link pubblico da mandare al paziente (email, WhatsApp, SMS — come preferisci).",
      "Il paziente non deve registrarsi: apre solo il link che gli mandi.",
    ],
  },
  {
    key: "spese",
    icona: "💶",
    titolo: "Spese",
    intro: "Le voci di costo dello studio: affitto, utenze, collaboratori esterni e altro.",
    passi: [
      "Per una spesa una tantum inserisci solo l'importo; per una ricorrente (es. affitto mensile) imposta la cadenza — l'app la conta da sola ogni mese dovuto, senza doverla reinserire.",
      "Tutte le spese confluiscono nel Bilancio dell'attività in Dashboard, a confronto con i ricavi da KPI Studio.",
    ],
  },
  {
    key: "manutenzione",
    icona: "🧰",
    titolo: "Manutenzione",
    intro: "I controlli di routine dello staff (es. autoclave, lubrificazione manipoli) con cadenza personalizzabile.",
    passi: [
      "Prima definisci i \"tipi\" di controllo che ti servono e ogni quanti giorni vanno fatti.",
      "Poi registra ogni volta che il controllo viene eseguito: se un tipo va in ritardo rispetto alla cadenza impostata, lo vedi segnalato in Dashboard.",
    ],
  },
  {
    key: "forum",
    icona: "💬",
    titolo: "Forum",
    intro: "Il confronto tra colleghi di tutti gli studi iscritti a Scadenze in Regola: dubbi clinici, gestionali, consigli.",
    passi: [
      "È spento di default: attivalo dalle Impostazioni se vuoi partecipare.",
      "Non è anonimo — chi scrive è riconoscibile come studio, non come singola persona.",
      "Puoi segnalare un post o un commento inappropriato: dopo alcune segnalazioni si nasconde automaticamente.",
    ],
  },
];

export function voceGuidaPer(key: string): VoceGuida | undefined {
  return GUIDA.find((v) => v.key === key);
}
