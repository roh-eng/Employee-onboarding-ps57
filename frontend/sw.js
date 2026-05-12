/**
 * Enterprise Workflow Hub — Service Worker
 * Provides offline caching for static assets and fallback responses.
 */

const CACHE_NAME = 'workflow-hub-v2';
const STATIC_ASSETS = [
    '/',
    '/frontend/login.html',
    '/css/style.css',
    '/js/app.js',
    '/js/i18n.js',
    '/i18n/en.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
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
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;

    // API calls: network-first with offline fallback
    if (request.url.includes('/api/')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    return response;
                })
                .catch(() => {
                    return new Response(
                        JSON.stringify({ success: false, error: 'You are offline. Please reconnect to access live data.' }),
                        { headers: { 'Content-Type': 'application/json' } }
                    );
                })
        );
        return;
    }

    // Static assets: cache-first
    event.respondWith(
        caches.match(request).then((cached) => {
            return cached || fetch(request).then((response) => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                return response;
            });
        })
    );
});

self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    event.waitUntil(
        self.registration.showNotification(data.title || 'Workflow Hub', {
            body: data.body || 'You have a new notification.',
            icon: '/assets/icon-192x192.png',
            badge: '/assets/icon-72x72.png',
            tag: data.tag || 'default'
        })
    );
});
