// =====================================================
// SERVICE WORKER - LUXE PWA
// =====================================================

const CACHE_NAME = 'luxe-cache-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/lujo/tienda.html',
    '/electronica/tienda.html',
    '/cuenta/login.html',
    '/cuenta/register.html',
    '/checkout/checkout.html',
    '/checkout/payment-success.html',
    '/product-detail.html',
    '/offline.html',
    '/css/style.css',
    '/css/landing.css',
    '/css/auth.css',
    '/js/config.js',
    '/js/app.js',
    '/js/auth.js',
    '/js/landing.js',
    '/js/pwa.js',
    '/js/notifications.js',
    '/manifest.json',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

self.addEventListener('install', (event) => {
    console.log('🟢 Service Worker instalado');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Cacheando recursos');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('activate', (event) => {
    console.log('🔄 Service Worker activado');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Eliminando caché antigua:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('/api/')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request).then((networkResponse) => {
                    if (event.request.method === 'GET') {
                        return caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, networkResponse.clone());
                            return networkResponse;
                        });
                    }
                    return networkResponse;
                });
            })
            .catch(() => {
                if (event.request.mode === 'navigate') {
                    return caches.match('/offline.html');
                }
            })
    );
});