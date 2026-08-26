import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  // Rumore noto degli script iniettati dai browser in-app di Facebook/Instagram
  // (non fanno parte del nostro codice, falliscono per conto loro su alcuni Android/iOS).
  ignoreErrors: [
    "setPhotoOptions failed",
    "sendDataToNative",
    "sendPageHideMessage",
    "sendBeforeUnloadMessage",
    "navigation_performance_logger_android",
    /window\.webkit\.messageHandlers/,
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
