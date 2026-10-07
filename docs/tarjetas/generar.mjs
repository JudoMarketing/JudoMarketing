// Saca los archivos de imprenta de la tarjeta (docs/tarjetas/tarjeta.html):
// por cada tamaño y cara, el arte a color y la placa de tinta blanca en PDF
// a tamaño final con 1/8" de sangrado, más una vista previa en PNG.
//
//   node docs/tarjetas/generar.mjs
//
// Salida en docs/tarjetas/imprenta/ y docs/tarjetas/vista/.

import { chromium } from "playwright-core";
import { mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const CHROME = process.env.CHROME ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const SANGRADO = 3.175;
const TAMANOS = { cr80: [85.6, 54], us: [88.9, 50.8] };

mkdirSync(join(AQUI, "imprenta"), { recursive: true });
mkdirSync(join(AQUI, "vista"), { recursive: true });

const navegador = await chromium.launch({ executablePath: existsSync(CHROME) ? CHROME : undefined });
for (const [tam, [ancho, alto]] of Object.entries(TAMANOS)) {
  const w = ancho + 2 * SANGRADO, h = alto + 2 * SANGRADO;
  for (const lado of ["frente", "dorso"]) {
    for (const capa of ["color", "blanco"]) {
      // 1 mm = 96/25.4 px en CSS; la vista previa sale a 6x (unos 2,000 px)
      const p = await navegador.newPage({
        viewport: { width: Math.ceil((w * 96) / 25.4), height: Math.ceil((h * 96) / 25.4) },
        deviceScaleFactor: 6,
      });
      const url = pathToFileURL(join(AQUI, "tarjeta.html")).href + `?lado=${lado}&tam=${tam}&capa=${capa}`;
      await p.goto(url, { waitUntil: "networkidle" });
      await p.evaluate(() => document.fonts.ready);
      const nombre = `${tam}-${lado}-${capa}`;
      await p.pdf({ path: join(AQUI, "imprenta", `${nombre}.pdf`), width: `${w}mm`, height: `${h}mm`, printBackground: true, pageRanges: "1" });
      if (capa === "color") {
        await p.screenshot({ path: join(AQUI, "vista", `${tam}-${lado}.png`) });
        await p.goto(url + "&guias=1", { waitUntil: "networkidle" });
        await p.evaluate(() => document.fonts.ready);
        await p.screenshot({ path: join(AQUI, "vista", `${tam}-${lado}-guias.png`) });
      }
      await p.close();
      console.log("listo", nombre);
    }
  }
}
await navegador.close();
