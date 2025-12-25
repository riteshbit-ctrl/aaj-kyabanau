// 🚀 BUMP THIS VERSION WHEN YOU DEPLOY
const CACHE_VERSION = "v6";
const CACHE_NAME = `aaj-kyabanau-${CACHE_VERSION}`;

// Files that can be cached (static assets only)
const URLS_TO_CACHE = [
  "/",
  "/index.html",
  "/app.js",
  "/manifest.json"
];

/* ================================
   INSTALL — cache files
================================ */
self.addEventListener("install", event => {
  console.log("SW installing…", CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE))
  );
});

/* ================================
   ACTIVATE — delete old caches
================================ */
self.addEventListener("activate", event => {
  console.log("SW activating… clearing old caches");
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );

  return self.clients.claim(); // take control immediately
});

/* ================================
   FETCH — always fresh index.html (no cache)
   everything else cache-first fallback to network
================================ */
self.addEventListener("fetch", event => {
  const req = event.request;

  // Ensure UI updates after deploy — never cache HTML
  if (req.mode === "navigate" || req.destination === "document") {
    return event.respondWith(fetch(req).catch(() => caches.match("/index.html")));
  }

  // For other files: cache-first fallback to network
  event.respondWith(
    caches.match(req).then(cacheRes => {
      return (
        cacheRes ||
        fetch(req).then(fetchRes =>
          caches.open(CACHE_NAME).then(cache => {
            cache.put(req, fetchRes.clone());
            return fetchRes;
          })
        )
      );
    })
  );
});