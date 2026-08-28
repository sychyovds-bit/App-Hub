const CACHE_NAME = 'apphub-v17';
const STATIC_ASSETS = [
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/styles/base.css',
  '/styles/components.css',
  '/core/app.js',
  '/core/registry.js',
  '/core/router.js',
  '/core/storage.js',
  '/core/toast.js',
  '/core/modal.js',
  '/core/theme.js',
  '/core/icons.js',
  '/core/utils.js',
  '/core/idb.js',
  '/core/config.js',
  '/core/cloud.js',
  '/core/favicon.js',
  '/core/preview.js',
  '/core/palette.js',
  '/core/notify.js',
  '/core/help.js',
  '/lib/qrcode.js',
  '/lib/supabase.js'
];

function htmlRequests() {
  return ['/', '/index.html'];
}

function isStaticAsset(url) {
  return STATIC_ASSETS.includes(url.pathname) ||
    /^\/apps\/.+\.js$/.test(url.pathname);
}

function isPageRequest(request) {
  return request.mode === 'navigate';
}

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(STATIC_ASSETS.concat(htmlRequests()))
    )
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
  const url = new URL(e.request.url);

  if (isPageRequest(e.request)) {
    e.respondWith(networkFirstHtml(e.request));
    return;
  }

  if (isStaticAsset(url)) {
    e.respondWith(cacheFirst(url));
    return;
  }
});

async function networkFirstHtml(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const clone = response.clone();
      const cache = await caches.open(CACHE_NAME);
      cache.put('/index.html', clone);
    }
    return response;
  } catch {
    const cached = await caches.match('/index.html');
    if (cached) return cached;
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

async function cacheFirst(url) {
  const cached = await caches.match(url.pathname);
  if (cached) return cached;
  try {
    const response = await fetch(url.origin + url.pathname);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(url.pathname, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}
