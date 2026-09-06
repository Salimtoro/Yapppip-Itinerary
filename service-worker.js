// Basic offline cache for the Office Itinerary app.
// On first visit (with internet), it saves a copy of the app.
// On later visits with no signal, it serves that saved copy so the app still opens.

const CACHE_NAME = 'office-itinerary-v2';
const FILES_TO_CACHE = [
  './index.html',
  './manifest.json',
  './icon-180.png',
  './icon-512.png',
  './logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only manage this app's own files. Let everything else (Firestore, Google
  // Fonts, etc.) go straight through untouched, so we never interfere with
  // the database's own connection.
  if (url.origin !== self.location.origin || event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
