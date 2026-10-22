// Nexora OS Progressive Web App - Service Worker v1.0.0
const CACHE_NAME = 'nexora-os-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.png',
  '/manifest.json',
  '/assets/nexora_app_icon.png',
  '/assets/nexora_web_logo.png'
];

// Install: Cache essential shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Warning: Some initial assets could not be pre-cached:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Cleanup old caches & claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting old cache version:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Strategy Network-First for APIs / dynamic data & Stale-While-Revalidate for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. NEVER cache API requests, socket.io, or POST/PUT/DELETE/PATCH mutations
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/socket.io/') ||
    event.request.method !== 'GET'
  ) {
    // Direct network pass-through
    return;
  }

  // 2. Navigation requests (HTML shell)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // 3. Static assets & Google Fonts: Stale-While-Revalidate
  if (
    url.origin === self.location.origin ||
    url.origin.includes('fonts.googleapis.com') ||
    url.origin.includes('fonts.gstatic.com') ||
    url.origin.includes('images.unsplash.com')
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});
