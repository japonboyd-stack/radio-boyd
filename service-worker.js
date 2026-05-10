const CACHE_NAME = 'radio-boyd-v1';
const ASSETS = [
  '/radio-boyd/',
  '/radio-boyd/index.html',
  '/radio-boyd/style.css',
  '/radio-boyd/app.js',
  '/radio-boyd/assets/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
