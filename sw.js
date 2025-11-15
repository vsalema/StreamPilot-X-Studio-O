const CACHE_NAME = 'spx-shell-v1';

const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./favs-patch.js",
  "./custom-addon.js",
  "./player-advanced.js",
  "./customlist-nav.js"
];

// Installation : on met en cache le shell de l'app
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch : cache-first pour le shell, réseau direct pour les streams & externes
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // On laisse passer tout ce qui est média / streaming et tout ce qui n’est pas du même origin
  const isMedia =
    request.destination === 'video' ||
    request.destination === 'audio' ||
    url.pathname.endsWith('.m3u8') ||
    url.pathname.endsWith('.mpd') ||
    url.pathname.endsWith('.mp4') ||
    url.pathname.endsWith('.mp3');

  if (isMedia || url.origin !== self.location.origin) {
    // Pas de cache, pas de hack CORS, on laisse le navigateur faire son job
    return;
  }

  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(request).catch(() => {
        // Fallback offline pour les navigations
        if (request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
