// Renderiza la lámpara 3D (three.js) a un PNG con fondo transparente.
// Uso: node lampara/render.mjs [salida.png]   (por defecto fuentes/lampara.png)
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CHROME } from "../navegador.mjs";
const D = dirname(fileURLToPath(import.meta.url));
const salida = process.argv[2] || `${D}/../fuentes/lampara.png`;
mkdirSync(dirname(salida), { recursive: true });
const b = await chromium.launch({ executablePath: CHROME, args: ["--ignore-certificate-errors", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 1200, height: 900 }, ignoreHTTPSErrors: true });
p.on("console", (m) => m.type() === "error" && console.log("console:", m.text()));
p.on("pageerror", (e) => console.log("error:", String(e)));
await p.goto(`file://${D}/index.html`);
await p.waitForFunction(() => window.listo === true, null, { timeout: 60000 });
await p.waitForTimeout(500);
await p.screenshot({ path: salida, omitBackground: true });
await b.close();
console.log("listo:", salida);
