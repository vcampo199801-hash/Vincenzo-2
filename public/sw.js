// Minimal service worker: only makes the app installable ("Aggiungi a schermata
// Home"). It intentionally does NOT cache pages or API/data requests — this
// app's content changes per request (scadenze, magazzino, ecc.), so serving
// stale data from a cache would be worse than no offline support at all.
const CACHE_NAME = "sir-static-v3";
const STATIC_ASSETS = ["/brand/pwa-icon-192.png", "/brand/pwa-icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || !STATIC_ASSETS.includes(url.pathname)) {
    return; // let the browser handle everything else normally (network)
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
