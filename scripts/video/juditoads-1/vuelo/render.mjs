// Graba el vuelo de Cesium cuadro por cuadro, sin textos encima.
// Uso: node vuelo/render.mjs ANCHO ALTO FPS SEGUNDOS [desde] [hasta]
// Ej.: node vuelo/render.mjs 1080 1920 60 4.5   → cuadros en vuelo/cuadros (o $SALIDA)
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CHROME, servir } from "../navegador.mjs";
const D = dirname(fileURLToPath(import.meta.url));
const [W, H, FPS, SEG, desde, hasta] = [+process.argv[2], +process.argv[3], +process.argv[4], +process.argv[5], +(process.argv[6] ?? 0), process.argv[7]];
const salida = process.env.SALIDA || `${D}/cuadros`;
mkdirSync(salida, { recursive: true });
const web = await servir([D]);
// SwiftShader: WebGL por software, para que funcione en un servidor sin GPU
const b = await chromium.launch({ executablePath: CHROME, args: ["--ignore-certificate-errors", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: W, height: H }, ignoreHTTPSErrors: true });
p.on("pageerror", (e) => console.log("error:", String(e).slice(0, 200)));
await p.goto(`${web.url}/index.html`);
await p.waitForFunction(() => window.preparado === true, null, { timeout: 120000 });
const total = Math.round(FPS * SEG);
const fin = hasta ? +hasta : total;
const t0 = Date.now();
for (let i = desde; i < fin; i++) {
  const t = i / (total - 1);
  await p.evaluate((t) => window.irA(t), t);
  await Promise.race([p.evaluate(() => window.listo()), new Promise((r) => setTimeout(r, 30000))]);
  await p.screenshot({ path: `${salida}/f${String(i).padStart(4, "0")}.png` });
  if (i % 10 === 0) console.log(`cuadro ${i}/${total} · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
await b.close();
web.cerrar();
console.log("listo");
