/**
 * Boton de emergencia: www.judomarketing.net/reparar
 *
 * Le dice al navegador que borre TODO lo que guardo de este dominio (cache,
 * service workers, localStorage). Es el enlace que le mandamos a cualquier
 * persona que reporte "me sale el sitio viejo" o "se cayo la pagina": entra
 * una vez, se limpia solo, y vuelve al sitio real.
 *
 * Clear-Site-Data solo funciona sobre HTTPS, que es como servimos siempre.
 */

const PAGINA = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Reparando tu navegador | Judo Marketing</title>
<style>
  body {
    margin: 0; min-height: 100vh; display: grid; place-items: center;
    background: #08080c; color: #e9e6f2; text-align: center; padding: 24px;
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  }
  h1 { font-size: 1.4rem; margin: 0 0 12px; }
  p { margin: 0 0 20px; color: #b9b3cc; line-height: 1.6; max-width: 34rem; }
  a {
    display: inline-block; background: #7b2dff; color: #fff; text-decoration: none;
    padding: 12px 26px; border-radius: 999px; font-weight: 600;
  }
</style>
</head>
<body>
  <div>
    <h1>Listo, limpiamos tu navegador</h1>
    <p>Borramos los datos viejos que tenia guardados de este dominio. En un segundo te llevamos al sitio.</p>
    <a href="/">Ir a Judo Marketing</a>
  </div>
  <script>setTimeout(function(){ location.replace("/"); }, 1800);</script>
</body>
</html>`;

export const dynamic = "force-dynamic";

export function GET() {
  return new Response(PAGINA, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "clear-site-data": '"cache", "storage"',
      "cache-control": "no-store, max-age=0",
      "x-robots-tag": "noindex",
    },
  });
}
