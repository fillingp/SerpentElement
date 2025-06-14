const CACHE_NAME = 'serpent-element-ai-cache-v1.3'; // Increment version to force update
const PRECACHE_ASSETS = [
  '/',
  'index.html',
  'index.css',
  // Note: index.tsx is compiled to JS, its output name might vary. 
  // If using a bundler, add the bundled JS and CSS files here.
  // For esm.sh imports, the browser handles caching, but we cache the entry points.
  'manifest.json',
  'icons/icon-192x192.png', // Add paths to your actual icons
  'icons/icon-512x512.png',
  'icons/apple-touch-icon-180x180.png',
  'icons/favicon.ico',
  // Key 3D assets if locally hosted and critical for offline, otherwise they'll be network-dependent.
  // 'piz_compressed.exr', // Example, if you decide to host it locally
  // The esm.sh URLs are third-party and usually well-cached by browsers.
  // Explicitly caching them in SW can be complex due to opaque responses for cross-origin requests.
  // It's often better to rely on browser caching for these and ensure your app handles offline gracefully if they fail.
];

// Install event: precache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Pre-caching offline page');
        return cache.addAll(PRECACHE_ASSETS.map(url => new Request(url, {cache: 'reload'}))); // Force reload to get latest
      })
      .then(() => self.skipWaiting()) // Activate worker immediately
      .catch(error => {
        console.error('[ServiceWorker] Pre-caching failed:', error);
      })
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all clients
  );
});

// Fetch event: serve cached assets if available, otherwise fetch from network
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Serve from cache first for precached assets or same-origin requests
  if (PRECACHE_ASSETS.includes(url.pathname) || url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If not in cache, fetch and cache
          return fetch(req)
            .then(fetchResponse => {
              // Check if we received a valid response
              if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                return fetchResponse; // Don't cache opaque responses or errors for same-origin
              }
              const responseToCache = fetchResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(req, responseToCache);
                });
              return fetchResponse;
            })
            .catch(error => {
              console.warn(`[ServiceWorker] Fetch failed for ${req.url}; returning offline page if applicable.`, error);
              // Optionally, return a generic offline page for navigation requests:
              // if (req.mode === 'navigate') {
              //   return caches.match('/offline.html'); // You would need an offline.html
              // }
            });
        })
    );
  } else {
    // For cross-origin requests (like esm.sh, CDNs), use a network-first strategy
    // to ensure up-to-date versions, relying on browser's HTTP cache.
    // Attempting to cache opaque responses is generally not useful.
    event.respondWith(
        fetch(req).catch(error => {
            console.warn(`[ServiceWorker] Cross-origin fetch failed for ${req.url}.`, error);
            // No specific fallback here, browser will show its own error.
        })
    );
  }
});
