// Service worker de Entre Naciones: hace instalable la app y da una
// pantalla offline. No cachea datos de Firestore (son de otro dominio).
const VERSION = "v9";
const CACHE = `entre-naciones-${VERSION}`;
const PRECACHE = ["/offline.html", "/logo.png", "/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Páginas: siempre de la red (precios y stock frescos); si no hay conexión, pantalla offline
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
    return;
  }

  // Archivos estáticos con hash e imágenes propias: primero caché
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/ejemplos/") || /\.(png|webp|woff2)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copia = res.clone();
              caches.open(CACHE).then((c) => c.put(request, copia));
            }
            return res;
          })
      )
    );
  }
});
