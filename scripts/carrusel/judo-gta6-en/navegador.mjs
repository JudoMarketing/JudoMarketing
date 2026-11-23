// Lo que comparten los scripts que abren un navegador: encontrar Playwright y
// Chromium en cualquier máquina, y un servidor estático mínimo para que las
// páginas carguen sus imágenes y letras con rutas relativas.
import { createRequire } from "node:module";
import { existsSync, readdirSync } from "node:fs";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const require = createRequire(import.meta.url);

export function cargarPlaywright() {
  for (const m of ["playwright-core", "playwright"]) {
    try { return require(m); } catch {}
  }
  throw new Error("Falta Playwright: npm i -g playwright-core (o npm i playwright-core en la carpeta del proyecto).");
}

export function buscarChrome(pw) {
  if (process.env.CHROME) return process.env.CHROME;
  const candidatos = [];
  for (const base of ["/opt/pw-browsers", `${process.env.HOME}/.cache/ms-playwright`, `${process.env.HOME}/Library/Caches/ms-playwright`]) {
    if (!existsSync(base)) continue;
    for (const d of readdirSync(base).filter((n) => /^chromium(-\d+)?$/.test(n)).sort().reverse()) {
      candidatos.push(
        join(base, d, "chrome-linux", "chrome"),
        join(base, d, "chrome-linux64", "chrome"),
        join(base, d, "chrome-mac", "Chromium.app/Contents/MacOS/Chromium"),
        join(base, d, "chrome-mac-arm64", "Chromium.app/Contents/MacOS/Chromium"),
      );
    }
  }
  candidatos.push("/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome");
  const hallado = candidatos.find((c) => existsSync(c));
  if (hallado) return hallado;
  try { const p = pw.chromium.executablePath(); if (p && existsSync(p)) return p; } catch {}
  return undefined; // que Playwright use el suyo
}

export async function abrirNavegador() {
  const pw = cargarPlaywright();
  return pw.chromium.launch({
    executablePath: buscarChrome(pw),
    args: ["--ignore-certificate-errors", "--hide-scrollbars", "--font-render-hinting=none"],
  });
}

const TIPOS = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".svg": "image/svg+xml", ".mp4": "video/mp4", ".webm": "video/webm", ".woff2": "font/woff2",
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
          return res.end(datos);
        } catch {}
      }
      res.writeHead(404); res.end();
    });
    s.listen(0, "127.0.0.1", () => listo({ url: `http://127.0.0.1:${s.address().port}`, cerrar: () => s.close() }));
  });
}
