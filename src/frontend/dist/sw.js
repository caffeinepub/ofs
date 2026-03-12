const CACHE_NAME = "ofs-v2";
const PRECACHE = ["/", "/manifest.webmanifest"];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE).catch(() => {})),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  // Skip non-GET and cross-origin requests
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);
  const isCDN =
    url.hostname === "cdn.jsdelivr.net" || url.hostname === "api.qrserver.com";

  if (isCDN) {
    // Cache CDN resources (like jsQR, qrcode.js)
    e.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(e.request).then(
          (cached) =>
            cached ||
            fetch(e.request)
              .then((res) => {
                cache.put(e.request, res.clone());
                return res;
              })
              .catch(() => cached || new Response("Offline", { status: 503 })),
        ),
      ),
    );
    return;
  }

  // For same-origin: network first, fall back to cache, fall back to /
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() =>
        caches
          .match(e.request)
          .then((cached) => cached || caches.match("/") || new Response("Offline", { status: 503 })),
      ),
  );
});
