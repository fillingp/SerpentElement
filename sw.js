// Serpent Element AI - Service Worker
// Enhanced PWA functionality with offline support and intelligent caching

const CACHE_NAME = 'serpent-element-ai-v1.0.0';
const OFFLINE_CACHE = 'serpent-offline-v1.0.0';
const RUNTIME_CACHE = 'serpent-runtime-v1.0.0';

// Resources to cache immediately (critical files)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/index.css',
  '/index.tsx',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/favicon.ico',
  '/icons/apple-touch-icon-180x180.png'
];

// External resources to cache
const EXTERNAL_ASSETS = [
  'https://esm.sh/lit@^3.3.0',
  'https://esm.sh/@google/genai@^0.9.0',
  'https://esm.sh/three@^0.176.0'
];

// API endpoints to handle differently
const API_ENDPOINTS = [
  'https://generativelanguage.googleapis.com',
  'https://api.serpent-element.ai'
];

// Network-first strategies for dynamic content
const NETWORK_FIRST_PATTERNS = [
  /\/api\//,
  /generativelanguage\.googleapis\.com/,
  /\.json$/
];

// Cache-first strategies for static assets
const CACHE_FIRST_PATTERNS = [
  /\.(js|css|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot)$/,
  /esm\.sh/,
  /icons\//,
  /screenshots\//
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAME).then((cache) => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Cache external dependencies
      caches.open(RUNTIME_CACHE).then((cache) => {
        console.log('🌐 Caching external dependencies');
        return Promise.all(
          EXTERNAL_ASSETS.map(url => 
            fetch(url)
              .then(response => cache.put(url, response))
              .catch(err => console.warn(`Failed to cache ${url}:`, err))
          )
        );
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(cacheName => 
              cacheName.startsWith('serpent-') && 
              ![CACHE_NAME, OFFLINE_CACHE, RUNTIME_CACHE].includes(cacheName)
            )
            .map(cacheName => {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - intelligent caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Handle different types of requests with appropriate strategies
    
    // 1. API requests - Network first with fallback
    if (isApiRequest(url)) {
      return await networkFirstStrategy(request);
    }
    
    // 2. Static assets - Cache first
    if (isStaticAsset(url)) {
      return await cacheFirstStrategy(request);
    }
    
    // 3. External dependencies - Stale while revalidate
    if (isExternalDependency(url)) {
      return await staleWhileRevalidateStrategy(request);
    }
    
    // 4. Navigation requests - Network first with offline fallback
    if (request.destination === 'document') {
      return await navigationStrategy(request);
    }
    
    // 5. Default - Network with cache fallback
    return await networkWithCacheFallback(request);
    
  } catch (error) {
    console.error('Fetch error:', error);
    return await getCachedResponseOrOffline(request);
  }
}

// Network first strategy (for APIs)
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for API failures
    return new Response(
      JSON.stringify({
        error: 'Network unavailable',
        message: 'Please check your internet connection',
        offline: true
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Cache first strategy (for static assets)
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Update cache in background if older than 1 hour
    if (shouldUpdateCache(cachedResponse)) {
      updateCacheInBackground(request);
    }
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Failed to fetch and cache not available:', request.url);
    throw error;
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidateStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  // Always try to update in background
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      const cache = caches.open(RUNTIME_CACHE);
      cache.then(c => c.put(request, response.clone()));
    }
    return response;
  }).catch(err => {
    console.warn('Background fetch failed:', err);
    return null;
  });
  
  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Otherwise wait for network
  return await fetchPromise;
}

// Navigation strategy (for page requests)
async function navigationStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Navigation failed, returning cached index');
    
    // Return cached index.html for navigation failures
    const cachedIndex = await caches.match('/');
    if (cachedIndex) {
      return cachedIndex;
    }
    
    // Ultimate fallback - offline page
    return createOfflinePage();
  }
}

// Network with cache fallback
async function networkWithCacheFallback(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Helper functions
function isApiRequest(url) {
  return API_ENDPOINTS.some(endpoint => url.href.includes(endpoint)) ||
         NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname));
}

function isStaticAsset(url) {
  return CACHE_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname)) ||
         url.origin === self.location.origin;
}

function isExternalDependency(url) {
  return url.origin !== self.location.origin &&
         (url.hostname === 'esm.sh' || url.hostname.includes('cdn'));
}

function shouldUpdateCache(response) {
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return true;
  
  const responseDate = new Date(dateHeader);
  const now = new Date();
  const oneHour = 60 * 60 * 1000;
  
  return (now - responseDate) > oneHour;
}

async function updateCacheInBackground(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response);
    }
  } catch (error) {
    console.warn('Background cache update failed:', error);
  }
}

async function getCachedResponseOrOffline(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Return appropriate offline response
  if (request.destination === 'document') {
    return createOfflinePage();
  }
  
  return new Response('Offline', { status: 503 });
}

function createOfflinePage() {
  const offlineHTML = `
    <!DOCTYPE html>
    <html lang="cs">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Offline - Serpent Element AI</title>
      <style>
        body {
          margin: 0;
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(45deg, #1a1625 0%, #2d1b69 100%);
          color: #f0f0f0;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .container {
          max-width: 400px;
          background: rgba(255,255,255,0.05);
          border-radius: 20px;
          padding: 2rem;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        h1 {
          margin: 0 0 1rem;
          color: #7c3aed;
        }
        p {
          margin: 0 0 2rem;
          opacity: 0.8;
          line-height: 1.6;
        }
        .btn {
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 10px;
          font-size: 1rem;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: transform 0.2s;
        }
        .btn:hover {
          transform: translateY(-2px);
        }
        .status {
          margin-top: 1rem;
          font-size: 0.9rem;
          opacity: 0.6;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📡</div>
        <h1>Jste offline</h1>
        <p>Serpent Element AI vyžaduje internetové připojení pro AI funkce. Zkontrolujte prosím své připojení a zkuste to znovu.</p>
        <button class="btn" onclick="window.location.reload()">
          🔄 Zkusit znovu
        </button>
        <div class="status" id="status">
          Kontrola připojení...
        </div>
      </div>
      
      <script>
        // Check online status
        function updateStatus() {
          const status = document.getElementById('status');
          if (navigator.onLine) {
            status.textContent = '🌐 Připojení obnoveno - klikněte pro pokračování';
            status.style.color = '#10b981';
          } else {
            status.textContent = '📡 Stále offline';
            status.style.color = '#ef4444';
          }
        }
        
        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);
        updateStatus();
        
        // Auto-reload when back online
        window.addEventListener('online', () => {
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        });
      </script>
    </body>
    </html>
  `;
  
  return new Response(offlineHTML, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// Background sync for data synchronization
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'chat-sync') {
    event.waitUntil(syncChatData());
  }
});

async function syncChatData() {
  try {
    // Sync any pending chat data when back online
    const pendingData = await getStoredData('pending-chats');
    if (pendingData && pendingData.length > 0) {
      console.log('📤 Syncing pending chat data');
      // Implementation would sync with backend
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('📢 Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Nová zpráva od Serpent Element AI',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-96.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Otevřít',
        icon: '/icons/shortcut-chat.png'
      },
      {
        action: 'dismiss',
        title: 'Zrušit'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Serpent Element AI', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        // Focus existing tab or open new one
        const existingClient = clients.find(client => 
          client.url.includes(self.location.origin)
        );
        
        if (existingClient) {
          return existingClient.focus();
        } else {
          return self.clients.openWindow('/');
        }
      })
    );
  }
});

// Utility function for local storage in service worker
async function getStoredData(key) {
  // Implementation would use IndexedDB or similar
  return null;
}

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('💬 Service Worker received message:', event.data);
  
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
      case 'CACHE_URLS':
        event.waitUntil(cacheUrls(event.data.urls));
        break;
      case 'CLEAR_CACHE':
        event.waitUntil(clearCache(event.data.cacheName));
        break;
    }
  }
});

async function cacheUrls(urls) {
  const cache = await caches.open(RUNTIME_CACHE);
  return Promise.all(
    urls.map(url => 
      fetch(url)
        .then(response => cache.put(url, response))
        .catch(err => console.warn(`Failed to cache ${url}:`, err))
    )
  );
}

async function clearCache(cacheName) {
  return caches.delete(cacheName || CACHE_NAME);
}

console.log('✅ Serpent Element AI Service Worker loaded successfully');
