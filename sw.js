// Bump this version whenever the app's files change, so old caches get cleared.
const CACHE_NAME = 'metronome-v6';
// Everything the app needs, so it runs fully offline once installed.
const ASSETS = [
  './',
  './index.html',
  './tailwind.css?v=4',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './fonts/inter-400.woff',
  './fonts/inter-600.woff',
  './fonts/inter-700.woff',
  './fonts/inter-800.woff',
  './fonts/jetbrains-mono-400.woff',
  './fonts/jetbrains-mono-700.woff'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Remove caches from older versions and take control of open pages right away.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  // Pages: network first, so updates pushed to GitHub show up; fall back to the cache when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html').then((cached) => cached || caches.match('./')))
    );
    return;
  }

  // Everything else: cache first, then network.
  event.respondWith(
    caches.match(request).then((response) => response || fetch(request))
  );
});
