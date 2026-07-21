import Stripe from "stripe";
import { PIANI, type PianoKey } from "@/lib/plans";

let stripeClient: Stripe | null = null;

/** Returns null (instead of throwing) when Stripe isn't configured yet, so the
 * app keeps working in local/dev without payment keys set up. */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** Un piano è acquistabile solo se ha anche il proprio Price ID configurato. */
export function isPianoConfigured(piano: PianoKey) {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env[PIANI[piano].stripePriceEnvVar]);
}
