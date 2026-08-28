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
  // Filtro strutturale, non solo per messaggio: ogni caso visto finora aveva un
  // messaggio diverso ("setPhotoOptions failed", "e[o] is not a function", ...)
  // ma la stessa firma nello stack — file con schema "app:///" invece di
  // "https://app.sorrisiinregola.com/...". Quello schema non esiste sul nostro
  // sito vero: lo creano solo i browser in-app (Instagram/Facebook) quando
  // riscrivono gli indirizzi delle risorse a modo loro. Invece di aggiungere un
  // messaggio alla lista sopra ogni volta che ne spunta uno nuovo, scartiamo
  // qualsiasi errore con quella firma, a prescindere dal testo.
  beforeSend(event) {
    const frames = event.exception?.values?.flatMap((v) => v.stacktrace?.frames ?? []) ?? [];
    const daBrowserInApp = frames.some((f) => f.filename?.startsWith("app://"));
    return daBrowserInApp ? null : event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
