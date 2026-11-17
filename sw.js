const CACHE_NAME = 'comidafull-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './login.html',
  './css/styles.css',
  './js/supabase-config.js',
  './js/app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Evento de Instalación
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Archivos cacheados con éxito');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Evento de Activación
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Limpiando caché antigua');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Evento Fetch (Servir assets desde caché o red)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});