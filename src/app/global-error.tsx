"use client";

import { useEffect } from "react";

/**
 * Última red de seguridad: si algo falla en el navegador, en vez de la
 * pantalla en blanco de "Application error" el visitante ve la marca y
 * un botón. Si el fallo viene de una versión vieja del sitio (archivos
 * que ya no existen tras un despliegue), se recarga solo una vez.
 */

const FLAG = "judo-recarga-version";

function looksLikeOldVersion(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("chunkloaderror") ||
    m.includes("loading chunk") ||
    m.includes("dynamically imported module") ||
    m.includes("unexpected token '<'")
  );
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const msg = `${error?.name ?? ""} ${error?.message ?? ""}`;
    if (!looksLikeOldVersion(msg)) return;
    try {
      if (sessionStorage.getItem(FLAG)) return;
      sessionStorage.setItem(FLAG, "1");
    } catch {
      /* seguimos igual */
    }
    window.location.reload();
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0b12",
          color: "#f5f5f7",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <div
            style={{
              width: 72,
              height: 72,
              margin: "0 auto 20px",
              borderRadius: "50%",
              background: "radial-gradient(circle at 35% 30%, #a855f7, #7b2dff 60%, #2a1f45)",
              boxShadow: "0 12px 40px -12px rgba(123,45,255,0.8)",
            }}
          />
          <h1 style={{ fontSize: 22, margin: "0 0 10px" }}>Se nos cruzaron los cables</h1>
          <p style={{ color: "#c9c9d4", fontSize: 14, lineHeight: 1.6, margin: "0 0 22px" }}>
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
              window.location.reload();
            }}
            style={{
              border: "none",
              borderRadius: 999,
              padding: "13px 34px",
              background: "linear-gradient(120deg,#7b2dff,#9a4dff)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
          <p style={{ marginTop: 24, fontSize: 12, color: "#6b6b7a" }}>
            Judo Marketing ·{" "}
            <a href="https://www.judomarketing.net" style={{ color: "#a855f7" }}>
              www.judomarketing.net
            </a>{" "}
            · +1 305 934 9981
          </p>
        </div>
      </body>
    </html>
  );
}
