const cacheName = "SchoolSchedulePWA";

const appShellFiles = [
    "./",
    "./script.js",
    "./style.css",
    "./favicon.ico",
    "./icons/icon (512).png",
];
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(cacheName).then(cache => {
            return cache.addAll(appShellFiles);
        })
    );
});


/**
 * @param {Request} request
 */
async function cacheResponse(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        return Response.error();
    }
}

/**
 * @param {Request} request
 */
async function networkResponse(request) {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
        const cache = await caches.open(cacheName);
        cache.put(request, networkResponse.clone());
    }
    return networkResponse;
}

/**
 * @param {Request} request
 */
async function cache(request) {
    const cacheResponsePromise = cacheResponse(request);
    const networkResponsePromise = networkResponse(request);
    return (await cacheResponsePromise) || (await networkResponsePromise);
}

/**
 * @param {Event} event
 */
function onFetch(event) {
    event.respondWith(cache(event.request));
}

self.addEventListener("fetch", onFetch);