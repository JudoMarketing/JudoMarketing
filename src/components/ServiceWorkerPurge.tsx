"use client";

import { useEffect } from "react";

/**
 * Limpia cualquier service worker viejo que haya quedado en el navegador del
 * visitante (el del sitio anterior en Wix) junto con su cache. Sin esto, ese
 * service worker sigue interceptando la navegacion y sirviendo el sitio viejo
 * o una pagina rota, aunque el dominio ya apunte a Vercel.
 *
 * Solo recarga la pagina si de verdad encontro algo que borrar, y como maximo
 * una vez por pestaña.
 */

const FLAG = "judo-sw-limpio";

export default function ServiceWorkerPurge() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let cancelado = false;

    void (async () => {
      let encontrado = false;

      try {
        const registros = await navigator.serviceWorker.getRegistrations();
        for (const registro of registros) {
          const borrado = await registro.unregister();
          if (borrado) encontrado = true;
        }
      } catch {
        /* navegador sin permisos: no pasa nada */
      }

      try {
        if (typeof caches !== "undefined") {
          const llaves = await caches.keys();
          if (llaves.length > 0) encontrado = true;
          await Promise.all(llaves.map((llave) => caches.delete(llave)));
        }
      } catch {
        /* navegador sin cache storage: no pasa nada */
      }

      if (!encontrado || cancelado) return;

      try {
        if (window.sessionStorage.getItem(FLAG)) return;
        window.sessionStorage.setItem(FLAG, "1");
      } catch {
        return; // sin sessionStorage no arriesgamos un bucle de recargas
      }

      window.location.reload();
    })();

    return () => {
      cancelado = true;
    };
  }, []);

  return null;
}
