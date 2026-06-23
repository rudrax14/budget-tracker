// Budget Tracker service worker — network-first so pages/data are never stale.
const CACHE = "budget-tracker-v2";
const OFFLINE_URLS = ["/", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(OFFLINE_URLS))
      .catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return; // never touch mutations / server actions

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Immutable, content-hashed assets → cache-first.
  const isStatic =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icon-") ||
    url.pathname === "/apple-touch-icon.png" ||
    url.pathname === "/manifest.json";

  if (isStatic) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(request, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  // Pages, RSC payloads, everything else → network-first; cache only as an
  // offline fallback so the app is never served stale content while online.
  event.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy));
        return res;
      })
      .catch(() =>
        caches
          .match(request)
          .then(
            (cached) =>
              cached ||
              (request.mode === "navigate"
                ? caches.match("/")
                : Response.error()),
          ),
      ),
  );
});
