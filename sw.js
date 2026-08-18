const CACHE_NAME = 'apphub-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/styles/base.css',
  '/styles/components.css',
  '/core/app.js',
  '/core/registry.js',
  '/core/router.js',
  '/core/storage.js',
  '/core/toast.js',
  '/core/modal.js',
  '/core/theme.js',
  '/core/icons.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      });
    }).catch(() => caches.match('/index.html'))
  );
});
