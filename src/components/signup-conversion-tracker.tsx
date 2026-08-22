"use client";

import { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/** Invia gli eventi standard Meta "CompleteRegistration" e "StartTrial" al
 * Pixel una sola volta, subito dopo che un nuovo studio si è appena
 * registrato (arrivo da /signup con ?signup=1&reg_eid=...&trial_eid=...),
 * poi ripulisce l'URL così un refresh o un link condiviso non li reinvia.
 *
 * In questa app registrazione e inizio prova gratuita avvengono nello
 * stesso istante (stessa transazione in signupAction), quindi i due eventi
 * scattano nello stesso punto — ma restano due eventi Meta distinti, con
 * eventID separati generati lato server in signupAction. Quegli stessi
 * eventID sono pronti per essere riusati in futuro dalla Conversions API
 * lato server (stesso evento, stesso ID → Meta deduplica automaticamente
 * invece di contarlo due volte). */
export function SignupConversionTracker() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("signup") !== "1") return;
    const regEventId = searchParams.get("reg_eid");
    const trialEventId = searchParams.get("trial_eid");

    window.fbq?.("track", "CompleteRegistration", {}, regEventId ? { eventID: regEventId } : undefined);
    window.fbq?.("track", "StartTrial", {}, trialEventId ? { eventID: trialEventId } : undefined);

    router.replace(pathname);
  }, [searchParams, router, pathname]);

  return null;
}
