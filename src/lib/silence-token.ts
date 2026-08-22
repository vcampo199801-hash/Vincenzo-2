import { SignJWT, jwtVerify } from "jose";

// Firma i link "silenzia questa voce" nelle email di riepilogo: click diretto
// dall'email, senza dover fare login. Il token identifica solo quale riga
// silenziare/riattivare (mai dati sensibili), quindi una scadenza generosa
// (l'email può essere letta con calma, anche mesi dopo) è un rischio basso.
const ALG = "HS256";

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET non impostato.");
  return new TextEncoder().encode(secret);
}

// "magazzino-scorta" condivide lo stesso record/flag di "magazzino" (vedi
// aggiornaFlag in /api/silenzia): esiste solo per portare al riordino invece
// che alla scheda dell'articolo, vedi sezioneApp.
export type TipoVoce = "adempimento" | "farmaco" | "magazzino" | "magazzino-scorta" | "manutenzione" | "forum";

export type SilenziaPayload = { studioId: string; tipo: TipoVoce; id: string; silenzia: boolean };

export async function creaTokenSilenzia(payload: SilenziaPayload): Promise<string> {
  return new SignJWT(payload).setProtectedHeader({ alg: ALG }).setIssuedAt().setExpirationTime("180d").sign(getSecret());
}

export async function verificaTokenSilenzia(token: string): Promise<SilenziaPayload> {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as unknown as SilenziaPayload;
}

/** Dove portare l'utente per vedere/gestire una voce specifica del riepilogo
 * email — usato sia nel link del nome voce sia nel bottone "Apri l'app" della
 * pagina di conferma silenziamento. La manutenzione non ha una scheda per
 * singolo record (solo l'elenco), quindi porta al modulo intero.
 *
 * "magazzino" (lotto in scadenza) porta alla scheda dell'articolo, perché
 * serve aggiornare la data di scadenza del lotto. "magazzino-scorta" (scorta
 * bassa/da riordinare) porta invece all'elenco con il riordino già aperto:
 * cambiare la quantità dalla scheda articolo non traccia il costo e non
 * confluisce nel Bilancio, solo il bottone "+ Riordino" lo fa. */
export function sezioneApp(tipo: TipoVoce, id: string): string {
  switch (tipo) {
    case "adempimento":
      return `/app/scadenzario/${id}/edit`;
    case "farmaco":
      return `/app/farmaci/${id}/edit`;
    case "magazzino":
      return `/app/magazzino/${id}/edit`;
    case "magazzino-scorta":
      return `/app/magazzino?riordino=${id}`;
    case "manutenzione":
      return `/app/manutenzione`;
    case "forum":
      return `/app/forum/${id}`;
  }
}
