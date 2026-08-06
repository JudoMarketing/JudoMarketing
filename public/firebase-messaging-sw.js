/**
 * Kill switch de service workers.
 *
 * El sitio viejo (Wix) registraba un service worker en este mismo dominio.
 * Ese service worker se queda instalado en el navegador del visitante para
 * siempre: intercepta la navegacion y sirve el HTML viejo desde su cache,
 * aunque el dominio ya apunte a otro lado. Por eso a algunas personas les
 * aparece el sitio anterior o una pagina rota "de la nada".
 *
 * Este archivo se sirve en las rutas donde Wix registraba el suyo. Cuando el
 * navegador revisa si hay una version nueva del service worker, se encuentra
 * con este, lo instala, y este se autodestruye: borra todos los caches y se
 * desregistra. A partir de ahi el visitante ve siempre el sitio real.
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      } catch {
        /* el navegador no dejo tocar el cache: seguimos igual */
      }

      try {
        await self.registration.unregister();
      } catch {
        /* nada que hacer */
      }

      try {
        const windows = await self.clients.matchAll({ type: "window" });
        for (const client of windows) {
          client.navigate(client.url);
        }
      } catch {
        /* nada que hacer */
      }
    })()
  );
});

// Nunca interceptamos nada: todo va directo a la red.
self.addEventListener("fetch", () => {});
