const CACHE_NAME = "eatobiotics-v2"
const PRECACHE_URLS = ["/", "/myplate", "/assessment", "/food", "/offline"]

// Install: pre-cache key pages
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Best-effort precache — don't fail install if a URL is unavailable
      return Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)))
    })
  )
  self.skipWaiting()
})

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

// Fetch: cache-first for static assets, network-first for everything else
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return
  // Skip API calls — never cache these
  if (event.request.url.includes("/api/")) return
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // Serve from cache, update in background
        fetch(event.request)
          .then((res) => {
            if (res.ok) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, res))
            }
          })
          .catch(() => {}) // ignore network errors during background refresh
        return cached
      }

      // Not in cache — fetch from network and cache the response
      return fetch(event.request)
        .then((res) => {
          if (res.ok && res.type === "basic") {
            const clone = res.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
          return res
        })
        .catch(() => {
          // Offline fallback — return branded offline page
          return caches.match("/offline") || new Response("Offline", { status: 503 })
        })
    })
  )
})
