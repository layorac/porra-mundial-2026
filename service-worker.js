const CACHE_NAME = "porra-2026-v1";
const PRECACHE_URLS = [
  "./index.html",
  "./app.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Network-first for API calls (Apps Script), cache-first for static assets
self.addEventListener("fetch", function(event) {
  const url = event.request.url;

  // Never cache POST requests or calls to the Apps Script API
  if (event.request.method !== "GET" || url.indexOf("script.google.com") !== -1) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      const fetchPromise = fetch(event.request).then(function(networkResponse) {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(function() {
        return cached;
      });
      return cached || fetchPromise;
    })
  );
});
