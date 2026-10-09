// Vista de presentación: las dos caras en PVC negro, con esquinas redondeadas
// y brillo de plástico. Usa las vistas de docs/tarjetas/vista/ (correr antes
// generar.mjs). Salida: docs/tarjetas/vista/mockup.png
import { chromium } from "playwright-core";
import sharp from "sharp";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const CHROME = process.env.CHROME ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const ESCALA = 6 * (96 / 25.4); // px por mm en las vistas (generar.mjs)
const sangrado = Math.round(3.175 * ESCALA);

async function cortada(nombre) {
  const f = join(AQUI, "vista", `${nombre}.png`);
  const { width, height } = await sharp(f).metadata();
  const buf = await sharp(f)
    .extract({ left: sangrado, top: sangrado, width: width - 2 * sangrado, height: height - 2 * sangrado })
    .resize({ width: 1400 })
    .png()
    .toBuffer();
  return "data:image/png;base64," + buf.toString("base64");
}

const frente = await cortada("us-frente");
const dorso = await cortada("us-dorso");
const html = `<!doctype html><html><head><style>
  html,body{margin:0;width:1800px;height:1200px;overflow:hidden}
  body{background:radial-gradient(1200px 800px at 30% 20%,#2a1c4a 0%,#14111f 45%,#08070c 100%);display:grid;place-items:center}
  .mesa{position:relative;width:1800px;height:1200px;perspective:2600px}
  .t{position:absolute;width:760px;aspect-ratio:88.9/50.8;border-radius:${(3.18 / 88.9) * 100}% / ${(3.18 / 50.8) * 100}%;
     overflow:hidden;box-shadow:0 40px 80px -20px rgba(0,0,0,.85),0 12px 24px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.05)}
  .t img{width:100%;height:100%;display:block}
  .t::after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,rgba(255,255,255,.10) 0%,rgba(255,255,255,0) 32%,rgba(255,255,255,0) 70%,rgba(255,255,255,.05) 100%);pointer-events:none}
  .a{left:110px;top:120px;transform:rotateX(14deg) rotateZ(-9deg)}
  .b{left:930px;top:560px;transform:rotateX(14deg) rotateZ(6deg)}
</style></head><body><div class="mesa">
  <div class="t a"><img src="${frente}"></div>
  <div class="t b"><img src="${dorso}"></div>
</div></body></html>`;

const navegador = await chromium.launch({ executablePath: existsSync(CHROME) ? CHROME : undefined });
const p = await navegador.newPage({ viewport: { width: 1800, height: 1200 } });
await p.setContent(html);
await p.screenshot({ path: join(AQUI, "vista", "mockup.png") });
await navegador.close();
console.log("listo vista/mockup.png");
