"use client";

import Script from "next/script";
import { useCookieConsent } from "./cookie-consent";

/** Loads the Meta (Facebook/Instagram) ads pixel only once the visitor has
 * accepted cookies, and only if NEXT_PUBLIC_META_PIXEL_ID is configured. */
export function MetaPixel() {
  const consent = useCookieConsent();
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  if (consent !== "granted" || !pixelId) return null;

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${pixelId}');
        fbq('track', 'PageView');
      `}
    </Script>
  );
}
