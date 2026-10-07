// Originales en alta definición de cada cara: PNG a 1200 dpi, cortados a la
// medida final (sin sangrado), para compartir o para una imprenta que pida
// imagen en vez de PDF. Salida: docs/tarjetas/alta/.
//
//   node docs/tarjetas/alta.mjs

import { chromium } from "playwright-core";
import { mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const CHROME = process.env.CHROME ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const DPI = 1200;
const MM = 96 / 25.4; // px CSS por mm
const SANGRADO = 3.175;
const TAMANOS = { cr80: [85.6, 54], us: [88.9, 50.8] };

mkdirSync(join(AQUI, "alta"), { recursive: true });
const navegador = await chromium.launch({ executablePath: existsSync(CHROME) ? CHROME : undefined });
for (const [tam, [ancho, alto]] of Object.entries(TAMANOS)) {
  for (const lado of ["frente", "dorso"]) {
    const p = await navegador.newPage({
      viewport: { width: Math.ceil((ancho + 2 * SANGRADO) * MM), height: Math.ceil((alto + 2 * SANGRADO) * MM) },
      deviceScaleFactor: DPI / 96,
    });
    await p.goto(pathToFileURL(join(AQUI, "tarjeta.html")).href + `?lado=${lado}&tam=${tam}`, { waitUntil: "networkidle" });
    await p.evaluate(() => document.fonts.ready);
    const salida = join(AQUI, "alta", `${tam}-${lado}-${DPI}dpi.png`);
    await p.screenshot({ path: salida, clip: { x: SANGRADO * MM, y: SANGRADO * MM, width: ancho * MM, height: alto * MM } });
    await p.close();
    console.log("listo", salida);
  }
}
await navegador.close();
