// Originales en alta definición de cada cara, en PNG a 1200 dpi:
//
//   <tam>-<cara>-con-sangrado.png  con 1/8" extra por lado (3.75 x 2.25 in en
//                                  la de 3.5 x 2). Es el que se sube a una
//                                  imprenta en línea como Uprintly: aguanta
//                                  tanto si recortan como si encuadran.
//   <tam>-<cara>-final.png         la medida ya cortada, para compartir.
//
//   node docs/tarjetas/alta.mjs      (salida en docs/tarjetas/alta/)

import { chromium } from "playwright-core";
import { mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const CHROME = process.env.CHROME ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const DPI = 1200;
const MM = 96 / 25.4; // px CSS por mm
const SANGRADO = 3.175;
const TAMANOS = { us: [88.9, 50.8], cr80: [85.6, 54] };

mkdirSync(join(AQUI, "alta"), { recursive: true });
const navegador = await chromium.launch({ executablePath: existsSync(CHROME) ? CHROME : undefined });
for (const [tam, [ancho, alto]] of Object.entries(TAMANOS)) {
  for (const lado of ["frente", "dorso"]) {
    const w = (ancho + 2 * SANGRADO) * MM, h = (alto + 2 * SANGRADO) * MM;
    const p = await navegador.newPage({ viewport: { width: Math.ceil(w), height: Math.ceil(h) }, deviceScaleFactor: DPI / 96 });
    await p.goto(pathToFileURL(join(AQUI, "tarjeta.html")).href + `?lado=${lado}&tam=${tam}`, { waitUntil: "networkidle" });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: join(AQUI, "alta", `${tam}-${lado}-con-sangrado.png`), clip: { x: 0, y: 0, width: w, height: h } });
    await p.screenshot({ path: join(AQUI, "alta", `${tam}-${lado}-final.png`), clip: { x: SANGRADO * MM, y: SANGRADO * MM, width: ancho * MM, height: alto * MM } });
    await p.close();
    console.log("listo", tam, lado);
  }
}
await navegador.close();
// Los 1200 dpi van escritos en cada PNG (algunas imprentas leen de ahí el
// tamaño real): python3 -c "import glob;from PIL import Image;[Image.open(f).save(f,dpi=(1200,1200)) for f in glob.glob('docs/tarjetas/alta/*.png')]"
