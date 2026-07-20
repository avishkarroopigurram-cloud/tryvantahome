// Tryvanta Home — Service Worker
// Cache strategy:
//   API calls  (/api/*)  → network only (always fresh relay state)
//   Everything else       → stale-while-revalidate (fast loads, background refresh)

const CACHE = "tryvanta-v1";

const PRECACHE = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// ── Install: pre-cache shell assets ──────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

// ── Activate: remove stale caches ─────────────────────────────────────────────
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

// ── Fetch ──────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests.
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // API calls always go to the network; never serve stale relay state.
  if (url.pathname.startsWith("/api/")) return;

  // Stale-while-revalidate for everything else (HTML, JS, CSS, fonts, icons).
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached); // offline: fall back to cached version

      return cached ?? fetchPromise;
    }),
  );
});
