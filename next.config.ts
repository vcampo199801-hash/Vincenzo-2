import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  experimental: {
    // Default di Next.js (1 MB) troppo basso per le foto caricate da telefono
    // (Comunicazione Pazienti, documenti Laboratori, cedolini Personale).
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default withSentryConfig(nextConfig, {
  org: "sorrisi-in-regola",
  project: "javascript-nextjs",
  silent: true,
});
