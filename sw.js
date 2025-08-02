const CACHE_NAME = "webstart-auto-cache";
const urlsToCache = [
    "/",
    "/index.html",
    "/style.css",
    "/main.js",
    "icons/icon-192x192.png",
    "icons/icon-512x512.png"
];

// Встановлення Service Worker і попереднє кешування
self.addEventListener("install", event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .catch(err => console.error("Помилка при кешуванні:", err))
    );
});

// Активація — очищення старих кешів
self.addEventListener("activate", event => {
    clients.claim();
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        })
    );
});

// Стратегія: cache-first з оновленням у фоні
self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);

    if (url.origin !== location.origin) return;

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            const fetchPromise = fetch(event.request)
                .then(networkResponse => {
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                })
                .catch(err => {
                    console.warn("Fetch помилка (офлайн?):", err);
                    return cachedResponse || new Response("⚠️ Немає підключення. Кеш відсутній.", {
                        status: 503,
                        headers: { "Content-Type": "text/plain; charset=utf-8" }
                    });
                });

            return cachedResponse || fetchPromise;
        })
    );
});

