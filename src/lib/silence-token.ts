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

export type TipoVoce = "adempimento" | "farmaco" | "magazzino" | "manutenzione";

export type SilenziaPayload = { studioId: string; tipo: TipoVoce; id: string; silenzia: boolean };

export async function creaTokenSilenzia(payload: SilenziaPayload): Promise<string> {
  return new SignJWT(payload).setProtectedHeader({ alg: ALG }).setIssuedAt().setExpirationTime("180d").sign(getSecret());
}

export async function verificaTokenSilenzia(token: string): Promise<SilenziaPayload> {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as unknown as SilenziaPayload;
}
