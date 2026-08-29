const CACHE_NAME = 'chongzi-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/ap2.png',
  '/log.png',
  '/manifest.json',
  '/favicon.svg',
  'https://cdn.jsdelivr.net/npm/hanzi-writer@3.5/dist/hanzi-writer.min.js',
  'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests and ignore API calls
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch new version in background to update cache (stale-while-revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            const contentType = networkResponse.headers.get('content-type') || '';
            const isAsset = event.request.url.match(/\.(js|css)$/);
            // Skip caching if server returned SPA fallback page for JS/CSS
            if (!(isAsset && contentType.includes('text/html'))) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        const contentType = networkResponse.headers.get('content-type') || '';
        const isAsset = event.request.url.match(/\.(js|css)$/);
        // If requesting a JS/CSS file but server returns HTML (SPA fallback), reject it to trigger client error handler
        if (isAsset && contentType.includes('text/html')) {
          return new Response('Asset not found', { status: 404, statusText: 'Not Found' });
        }

        if (networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback for document navigation when offline
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});
