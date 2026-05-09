const CACHE_NAME = 'quran-app-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './icons/icon-128x128.png',
  './icons/icon-144x144.png',
  './icons/icon-152x152.png',
  './icons/icon-192x192.png',
  './icons/icon-384x384.png',
  './icons/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/plyr@3.7.8/dist/plyr.css',
  'https://cdn.jsdelivr.net/npm/plyr@3.7.8/dist/plyr.polyfilled.min.js'
];

// Install event - cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const request = event.request;
  
  // For audio files from mp3quran.net, use cache-first strategy
  if (request.url.includes('mp3quran.net') && request.url.endsWith('.mp3')) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, resClone));
          return response;
        });
      })
    );
    return;
  }

  // For other requests, use network-first strategy
  event.respondWith(
    fetch(request).then(response => {
      const resClone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, resClone));
      return response;
    }).catch(() => caches.match(request))
  );
});