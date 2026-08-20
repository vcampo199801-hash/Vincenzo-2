"use client";

import { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/** Invia l'evento di conversione "Lead" al Pixel Meta una sola volta, subito
 * dopo che un nuovo studio si è appena registrato (arrivo da /signup con
 * ?signup=1), poi ripulisce l'URL così un refresh o un link condiviso non lo
 * reinviano. */
export function SignupLeadTracker() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("signup") !== "1") return;
    window.fbq?.("track", "Lead");
    router.replace(pathname);
  }, [searchParams, router, pathname]);

  return null;
}
