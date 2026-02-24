const CACHE_VERSION = 'v2';
const CACHE_NAME = `ofs-cache-${CACHE_VERSION}`;
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/generated/ofs-logo-transparent.dim_200x200.png',
  '/assets/generated/ai-compression-transparent.dim_64x64.png',
  '/assets/generated/camera-viewfinder-transparent.dim_64x64.png',
  '/assets/generated/drag-drop-zone.dim_400x300.png',
  '/assets/generated/file-recognition-placeholder-transparent.dim_64x64.png',
  '/assets/generated/qr-code-icon-transparent.dim_64x64.png',
  '/assets/generated/transfer-progress.dim_600x400.png',
  '/assets/generated/onboarding-qr.dim_400x300.png',
  '/assets/generated/onboarding-transfer.dim_400x300.png',
  '/assets/generated/onboarding-ai.dim_400x300.png',
  '/assets/generated/empty-transfer.dim_300x200.png',
  '/assets/generated/empty-history.dim_300x200.png',
  '/assets/generated/empty-users.dim_300x200.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.log('Cache addAll error:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith('ofs-cache-') && cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network-first for API, cache-first for assets
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Network-first strategy for API calls
  if (event.request.url.includes('/api/') || event.request.url.includes('?canisterId=')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone and cache successful responses
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        // Cache static assets and app shell
        if (
          event.request.url.includes('/assets/') ||
          event.request.url.endsWith('.js') ||
          event.request.url.endsWith('.css') ||
          event.request.url.endsWith('.html')
        ) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return response;
      }).catch(() => {
        // Return a basic offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Background sync for failed transfers
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transfers') {
    event.waitUntil(syncFailedTransfers());
  }
});

async function syncFailedTransfers() {
  // Placeholder for syncing failed transfers when connection is restored
  console.log('Syncing failed transfers...');
  // Implementation would retrieve failed transfers from IndexedDB and retry
}
