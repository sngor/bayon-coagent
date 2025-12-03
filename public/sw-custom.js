/**
 * Custom Service Worker for Mobile Agent Features
 * 
 * Provides:
 * - Offline support with intelligent caching
 * - Background sync for queued operations
 * - Push notification handling
 * - Cache management
 * 
 * Requirements: 6.1, 6.5, 7.3, 10.1
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `bayon-coagent-${CACHE_VERSION}`;
const OFFLINE_PAGE = '/offline.html';

// Assets to cache on install
const PRECACHE_ASSETS = [
    '/',
    '/offline.html',
    '/manifest.json',
    '/icon-192x192.svg',
];

// Cache strategies
const CACHE_STRATEGIES = {
    // Cache first, fallback to network
    CACHE_FIRST: 'cache-first',
    // Network first, fallback to cache
    NETWORK_FIRST: 'network-first',
    // Network only
    NETWORK_ONLY: 'network-only',
    // Cache only
    CACHE_ONLY: 'cache-only',
    // Stale while revalidate
    STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
};

// Route patterns and their strategies
const ROUTE_STRATEGIES = [
    // API routes - network first
    { pattern: /^\/api\//, strategy: CACHE_STRATEGIES.NETWORK_FIRST },
    // Static assets - cache first
    { pattern: /\.(js|css|png|jpg|jpeg|svg|gif|webp|woff|woff2)$/, strategy: CACHE_STRATEGIES.CACHE_FIRST },
    // HTML pages - network first
    { pattern: /\.html$/, strategy: CACHE_STRATEGIES.NETWORK_FIRST },
    // Default - network first
    { pattern: /.*/, strategy: CACHE_STRATEGIES.NETWORK_FIRST },
];

// ============================================================================
// Install Event
// ============================================================================

self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Precaching assets');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => {
                console.log('[SW] Service worker installed');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Installation failed:', error);
            })
    );
});

// ============================================================================
// Activate Event
// ============================================================================

self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                // Delete old caches
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Service worker activated');
                return self.clients.claim();
            })
    );
});

// ============================================================================
// Fetch Event
// ============================================================================

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip chrome extensions
    if (url.protocol === 'chrome-extension:') {
        return;
    }

    // Find matching strategy
    const route = ROUTE_STRATEGIES.find((r) => r.pattern.test(url.pathname));
    const strategy = route ? route.strategy : CACHE_STRATEGIES.NETWORK_FIRST;

    event.respondWith(
        handleFetch(request, strategy)
    );
});

/**
 * Handle fetch with specified strategy
 */
async function handleFetch(request, strategy) {
    switch (strategy) {
        case CACHE_STRATEGIES.CACHE_FIRST:
            return cacheFirst(request);
        case CACHE_STRATEGIES.NETWORK_FIRST:
            return networkFirst(request);
        case CACHE_STRATEGIES.NETWORK_ONLY:
            return networkOnly(request);
        case CACHE_STRATEGIES.CACHE_ONLY:
            return cacheOnly(request);
        case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
            return staleWhileRevalidate(request);
        default:
            return networkFirst(request);
    }
}

/**
 * Cache first strategy
 */
async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        return getOfflineFallback(request);
    }
}

/**
 * Network first strategy
 */
async function networkFirst(request) {
    const cache = await caches.open(CACHE_NAME);

    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await cache.match(request);
        if (cached) {
            return cached;
        }
        return getOfflineFallback(request);
    }
}

/**
 * Network only strategy
 */
async function networkOnly(request) {
    try {
        return await fetch(request);
    } catch (error) {
        return getOfflineFallback(request);
    }
}

/**
 * Cache only strategy
 */
async function cacheOnly(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    if (cached) {
        return cached;
    }

    return getOfflineFallback(request);
}

/**
 * Stale while revalidate strategy
 */
async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    const fetchPromise = fetch(request).then((response) => {
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    });

    return cached || fetchPromise;
}

/**
 * Get offline fallback
 */
async function getOfflineFallback(request) {
    const url = new URL(request.url);

    // For HTML pages, return offline page
    if (request.headers.get('accept')?.includes('text/html')) {
        const cache = await caches.open(CACHE_NAME);
        const offlinePage = await cache.match(OFFLINE_PAGE);
        if (offlinePage) {
            return offlinePage;
        }
    }

    // Return error response
    return new Response('Offline', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({
            'Content-Type': 'text/plain',
        }),
    });
}

// ============================================================================
// Background Sync
// ============================================================================

self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);

    if (event.tag === 'sync-offline-queue') {
        event.waitUntil(syncOfflineQueue());
    }
});

/**
 * Sync offline queue
 */
async function syncOfflineQueue() {
    try {
        // Notify clients to sync queue
        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
            client.postMessage({
                type: 'SYNC_QUEUE',
            });
        });
    } catch (error) {
        console.error('[SW] Sync failed:', error);
    }
}

// ============================================================================
// Push Notifications
// ============================================================================

self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');

    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (error) {
            data = { title: 'Notification', body: event.data.text() };
        }
    }

    const options = {
        body: data.body || 'You have a new notification',
        icon: '/icon-192x192.svg',
        badge: '/icon-192x192.svg',
        data: data.data || {},
        actions: data.actions || [],
        tag: data.tag || 'default',
        requireInteraction: data.requireInteraction || false,
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Bayon Coagent', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event.notification.tag);

    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if there's already a window open
                for (const client of clientList) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Open new window
                if (self.clients.openWindow) {
                    return self.clients.openWindow(urlToOpen);
                }
            })
    );
});

// ============================================================================
// Message Handler
// ============================================================================

self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.delete(CACHE_NAME).then(() => {
                console.log('[SW] Cache cleared');
            })
        );
    }
});
