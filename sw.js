
const CACHE_VERSION = "star-dive-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DATA_CACHE = `${CACHE_VERSION}-data`;

const STATIC_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

const DATABASE_URL = "./data/mongil_database.json";

// Instalar y guardar los recursos esenciales.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_FILES))
      .then(() => self.skipWaiting())
  );
});

// Activar la nueva versión y eliminar cachés antiguas.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return (
                name.startsWith("star-dive-") &&
                name !== STATIC_CACHE &&
                name !== DATA_CACHE
              );
            })
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Gestionar las solicitudes de la aplicación.
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Solo gestionar solicitudes GET.
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // No intervenir en solicitudes externas.
  if (url.origin !== self.location.origin) return;

  // La base de datos utiliza estrategia Network First.
  if (url.pathname.endsWith("/data/mongil_database.json")) {
    event.respondWith(networkFirst(request, DATA_CACHE));
    return;
  }

  // Las páginas utilizan estrategia Network First.
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, STATIC_CACHE));
    return;
  }

  // Los demás recursos utilizan estrategia Cache First.
  event.respondWith(cacheFirst(request, STATIC_CACHE));
});

// Primero intenta obtener el recurso de internet.
// Si falla, utiliza la copia guardada.
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);

    if (response && response.ok) {
      await cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    return new Response(
      "No hay conexión y no existe una copia guardada.",
      {
        status: 503,
        headers: {
          "Content-Type": "text/plain; charset=utf-8"
        }
      }
    );
  }
}

// Primero intenta utilizar la copia guardada.
// Si no existe, descarga el recurso.
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);

  if (response && response.ok) {
    await cache.put(request, response.clone());
  }

  return response;
}
