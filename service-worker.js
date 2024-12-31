const cacheName = "SchoolSchedulePWA";

const appShellFiles = [
    "./",
    "./script.js",
    "./dateUtility.js",
    "./scheduleUtility.js",
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
    return undefined;
}

/**
 * @param {Request} request
 */
async function networkResponse(request) {
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
async function cache(request) {
    if (request.method == "GET") {
        const cacheResponsePromise = cacheResponse(request);
        const networkResponsePromise = networkResponse(request);
        return (await cacheResponsePromise) || (await networkResponsePromise);
    } else {
        return await fetch(request);
    }
}

/**
 * @param {FetchEvent} event
 */
function onFetch(event) {
    event.respondWith(cache(event.request));
}

self.addEventListener("fetch", onFetch);