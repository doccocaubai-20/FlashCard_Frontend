const CACHE_NAME = 'chongzi-cache-v3';
const STATIC_ASSETS = [
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
      return cache.addAll(STATIC_ASSETS);
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
  // Only handle GET requests and ignore API calls
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;

  // Check if this is an HTML navigation or SPA route (no file extension on same-origin path)
  const isNavigation = 
    event.request.mode === 'navigate' ||
    event.request.destination === 'document' ||
    (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) ||
    (isSameOrigin && !url.pathname.includes('.') && !url.pathname.startsWith('/api'));

  // 1. For HTML navigation / SPA Routes: NETWORK-FIRST with /index.html fallback
  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline fallback to cached page or /index.html
          const cached = await caches.match(event.request);
          if (cached) return cached;
          const indexCached = (await caches.match('/index.html')) || (await caches.match('/'));
          if (indexCached) return indexCached;
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        })
    );
    return;
  }

  // 2. For static assets & JS/CSS chunks: CACHE-FIRST with Stale-While-Revalidate & Safe Catch
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Background revalidation
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const contentType = networkResponse.headers.get('content-type') || '';
              const isAsset = event.request.url.match(/\.(js|css)$/);
              if (!(isAsset && contentType.includes('text/html'))) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, networkResponse);
                });
              }
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          const contentType = networkResponse.headers.get('content-type') || '';
          const isAsset = event.request.url.match(/\.(js|css)$/);
          if (isAsset && contentType.includes('text/html')) {
            return new Response('Asset not found', { status: 404, statusText: 'Not Found' });
          }

          if (networkResponse.type === 'basic' || networkResponse.type === 'cors') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }

          return networkResponse;
        })
        .catch(async () => {
          // Safe fallback on fetch failure instead of unhandled promise rejection
          const fallback = await caches.match(event.request);
          if (fallback) return fallback;
          if (isSameOrigin && !url.pathname.includes('.')) {
            const indexCached = (await caches.match('/index.html')) || (await caches.match('/'));
            if (indexCached) return indexCached;
          }
          return new Response('Network Error', { status: 408, statusText: 'Request Timeout' });
        });
    })
  );
});
