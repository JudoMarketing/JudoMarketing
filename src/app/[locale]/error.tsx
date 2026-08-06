"use client";

import { useEffect } from "react";

/**
 * Red de seguridad por página: mantiene el encabezado y el pie del sitio
 * y ofrece reintentar. Si el error viene de una versión vieja del sitio,
 * recarga solo una vez.
 */

const FLAG = "judo-recarga-version";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const m = `${error?.name ?? ""} ${error?.message ?? ""}`.toLowerCase();
    const oldVersion =
      m.includes("chunkloaderror") ||
      m.includes("loading chunk") ||
      m.includes("dynamically imported module");
    if (!oldVersion) return;
    try {
      if (sessionStorage.getItem(FLAG)) return;
      sessionStorage.setItem(FLAG, "1");
    } catch {
      /* seguimos igual */
    }
    window.location.reload();
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <div className="rounded-2xl border border-judo-lilac/20 bg-[#0e0e16] p-8">
        <h1 className="text-2xl font-bold">Se nos cruzaron los cables</h1>
        <p className="mt-3 text-sm leading-relaxed text-judo-fog/70">
          Tuvimos un tropiezo cargando esta página. Vuelve a intentarlo, casi
          siempre se arregla al instante.
        </p>
        <button
          onClick={() => {
            try {
              sessionStorage.removeItem(FLAG);
            } catch {
              /* nada que limpiar */
            }
            reset();
          }}
          className="btn-primary mt-6"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
