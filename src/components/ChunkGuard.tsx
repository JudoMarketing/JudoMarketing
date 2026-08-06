"use client";

import { useEffect } from "react";

/**
 * Guardián de despliegues.
 *
 * Cuando publicamos una versión nueva, los navegadores que tenían la
 * página abierta (o la restauran del segundo plano del teléfono) siguen
 * pidiendo archivos de la versión anterior, que ya no existen. Eso es lo
 * que la gente ve como "se cayó de la nada" o "me salió el website
 * viejo". Aquí lo detectamos y recargamos una sola vez, en silencio.
 */

const FLAG = "judo-recarga-version";

function isVersionError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("chunkloaderror") ||
    m.includes("loading chunk") ||
    m.includes("loading css chunk") ||
    m.includes("failed to fetch dynamically imported module") ||
    m.includes("importing a module script failed") ||
    m.includes("unexpected token '<'") // un .js que devolvió HTML de error
  );
}

function reloadOnce() {
  try {
    // Una sola recarga por sesión: nunca un bucle infinito
    if (sessionStorage.getItem(FLAG)) return;
    sessionStorage.setItem(FLAG, "1");
  } catch {
    /* sin sessionStorage seguimos igual, el navegador no repite el bucle
       porque la recarga trae la versión nueva */
  }
  window.location.reload();
}

export default function ChunkGuard() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      if (isVersionError(e.message ?? "")) reloadOnce();
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason;
      const msg =
        typeof reason === "string" ? reason : (reason?.message ?? reason?.name ?? "");
      if (isVersionError(String(msg))) reloadOnce();
    };
    // Página restaurada desde el segundo plano del teléfono tras un
    // despliegue: se pide la versión fresca al servidor
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        try {
          sessionStorage.removeItem(FLAG);
        } catch {
          /* nada que limpiar */
        }
      }
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  return null;
}
