// Lo que comparten los scripts que abren Chromium: dónde está el navegador y un
// servidor estático mínimo para que las páginas carguen sus imágenes y fuentes.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

export const CHROME = process.env.CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const TIPOS = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml", ".mp4": "video/mp4", ".wasm": "application/wasm", ".xml": "application/xml", ".ktx2": "image/ktx2",
};

// Busca cada ruta en las carpetas, en orden, y entrega la primera que exista
export function servir(raices) {
  return new Promise((listo) => {
    const s = createServer(async (req, res) => {
      const ruta = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
      for (const r of raices) {
        try {
          const datos = await readFile(join(r, ruta));
          res.writeHead(200, { "content-type": TIPOS[extname(ruta).toLowerCase()] || "application/octet-stream" });
          res.end(datos);
          return;
        } catch {}
      }
      res.writeHead(404);
      res.end();
    });
    s.listen(0, "127.0.0.1", () => listo({ url: `http://127.0.0.1:${s.address().port}`, cerrar: () => s.close() }));
  });
}
