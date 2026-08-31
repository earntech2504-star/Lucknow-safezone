const CACHE_NAME = "lucknow-safezone-v1";

const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json"
];

/* ==============================
   INSTALL
================================= */

self.addEventListener("install", (event) => {

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(APP_SHELL);
      })
      .then(() => self.skipWaiting())
  );

});


/* ==============================
   ACTIVATE
================================= */

self.addEventListener("activate", (event) => {

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {

        return Promise.all(

          cacheNames.map((cacheName) => {

            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }

          })

        );

      })
      .then(() => self.clients.claim())
  );

});


/* ==============================
   FETCH
   Offline First Strategy
================================= */

self.addEventListener("fetch", (event) => {

  const request = event.request;

  // Only GET requests
  if (request.method !== "GET") {
    return;
  }


  event.respondWith(

    caches.match(request)

      .then((cachedResponse) => {

        // 1️⃣ Cache available → immediately return
        if (cachedResponse) {

          // Background mein latest version update karo
          fetch(request)
            .then((networkResponse) => {

              if (
                networkResponse &&
                networkResponse.status === 200
              ) {

                const responseClone =
                  networkResponse.clone();

                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(request, responseClone);
                  });

              }

            })
            .catch(() => {
              // Offline → cached version already shown
            });

          return cachedResponse;
        }


        // 2️⃣ Cache nahi → Network try
        return fetch(request)

          .then((networkResponse) => {

            if (
              !networkResponse ||
              networkResponse.status !== 200
            ) {
              return networkResponse;
            }


            const responseClone =
              networkResponse.clone();


            caches.open(CACHE_NAME)

              .then((cache) => {

                cache.put(
                  request,
                  responseClone
                );

              });


            return networkResponse;

          })


          // 3️⃣ Network bhi unavailable
          .catch(() => {

            // HTML page fallback
            if (
              request.headers.get("accept")
                ?.includes("text/html")
            ) {

              return caches.match("/index.html");

            }


            // Offline response
            return new Response(
              "Offline. Please connect to the internet.",
              {
                status: 503,
                statusText: "Offline",
                headers: {
                  "Content-Type": "text/plain"
                }
              }
            );

          });

      })

  );

});
