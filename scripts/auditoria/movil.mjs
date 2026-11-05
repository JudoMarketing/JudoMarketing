// Prueba de teléfono: un iPhone simulado (390 px) entra a cada sitio, baja
// hasta el pie, toca un enlace interno y mira cómo arranca la página nueva.
// Repite tres veces por sitio. Avisa de:
//   - ABAJO: la página nueva no empieza arriba (más de 40 px bajada);
//   - FOCO: un campo tomó el foco solo (en el iPhone abre el teclado y baja);
//   - ZOOM: campos con letra de menos de 16 px (el iPhone hace zoom al
//     tocarlos y el zoom se queda en la página siguiente);
//   - ANCHO: algo se sale por el lado (la página se puede mover de lado);
//   - VIEWPORT: maximum-scale o user-scalable=no (le quita el zoom con los
//     dedos a quien lo necesita) o sin etiqueta viewport.
//
// Uso:
//   node scripts/auditoria/movil.mjs                    (los de scripts/seguridad/sitios.txt)
//   node scripts/auditoria/movil.mjs www.judomarketing.net http://localhost:3000
//   node scripts/auditoria/movil.mjs --json …           (una línea JSON por sitio)
// Sale con código 1 si algún sitio tiene un aviso.
//
// Chromium simula el iPhone, no es Safari: lo que esto encuentra es real,
// pero lo que no encuentra se confirma en un teléfono de verdad.
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
let pw;
try { pw = require("playwright"); } catch { pw = createRequire(process.cwd() + "/")("playwright"); }
const { chromium, devices } = pw;

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = process.argv.slice(2);
const json = args.includes("--json");
let sitios = args.filter((a) => !a.startsWith("--"));
if (!sitios.length) {
  sitios = readFileSync(join(RAIZ, "scripts/seguridad/sitios.txt"), "utf8").split("\n")
    .map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
}
const conProtocolo = (s) => (/^https?:\/\//.test(s) ? s : "https://" + s);
const sinIdioma = (ruta) => ruta.replace(/^\/(es|en)(?=\/|$)/, "") || "/";

const navegador = await chromium.launch({
  proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: "localhost,127.0.0.1" } : undefined,
  args: ["--ignore-certificate-errors"],
});

async function probar(sitio) {
  const ctx = await navegador.newContext({ ...devices["iPhone 13"], ignoreHTTPSErrors: true, locale: "en-US" });
  const p = await ctx.newPage();
  const estado = (paso) => p.evaluate((paso) => {
    const foco = document.activeElement;
    const campos = [...document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]):not([type=range]):not([type=file]), textarea, select")]
      .filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
    return {
      paso, ruta: location.pathname, y: Math.round(scrollY),
      sobraAncho: document.documentElement.scrollWidth - innerWidth,
      foco: foco && foco !== document.body && /^(INPUT|TEXTAREA|SELECT)$/.test(foco.tagName) ? foco.tagName.toLowerCase() : null,
      chicos: [...new Set(campos.map((e) => getComputedStyle(e).fontSize).filter((f) => parseFloat(f) < 16))],
      viewport: document.querySelector("meta[name=viewport]")?.content ?? null,
    };
  }, paso);
  const r = { sitio, pasos: [], avisos: [] };
  try {
    await p.goto(conProtocolo(sitio), { waitUntil: "networkidle", timeout: 45000 }).catch(() => {});
    await p.waitForTimeout(3000);
    r.pasos.push(await estado("entrar"));
    const vistos = new Set([sinIdioma(new URL(p.url()).pathname)]);
    for (let i = 0; i < 3; i++) {
      await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await p.waitForTimeout(800);
      const hrefs = await p.evaluate(() => [...document.querySelectorAll("a[href]")].filter((a) => {
        const u = new URL(a.href, location.href);
        return u.origin === location.origin && !u.hash && a.target !== "_blank"
          && !/\.(pdf|jpe?g|png|webp|zip|mp4)$/i.test(u.pathname) && a.getBoundingClientRect().height > 0;
      }).map((a) => a.getAttribute("href")));
      const elegido = hrefs.find((h) => !vistos.has(sinIdioma(new URL(h, p.url()).pathname)));
      if (!elegido) break;
      vistos.add(sinIdioma(new URL(elegido, p.url()).pathname));
      const antes = p.url();
      const enlace = p.locator(`a[href="${elegido}"]`).last();
      try { await enlace.scrollIntoViewIfNeeded({ timeout: 3000 }); await enlace.tap({ timeout: 5000 }); }
      catch { await enlace.evaluate((a) => a.click()).catch(() => {}); }
      await p.waitForURL((u) => u.href !== antes, { timeout: 10000 }).catch(() => {});
      await p.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
      await p.waitForTimeout(2500);
      r.pasos.push(await estado("tocar " + elegido));
    }
  } catch (e) {
    r.error = String(e.message).slice(0, 160);
  }
  await ctx.close();
  for (const s of r.pasos) {
    if (s.paso !== "entrar" && s.y > 40) r.avisos.push(`ABAJO ${s.ruta}: empieza ${s.y} px bajada`);
    if (s.foco) r.avisos.push(`FOCO ${s.ruta}: un ${s.foco} tomó el foco solo`);
    if (s.chicos.length) r.avisos.push(`ZOOM ${s.ruta}: campos a ${s.chicos.join(", ")}`);
    if (s.sobraAncho > 2) r.avisos.push(`ANCHO ${s.ruta}: sobran ${s.sobraAncho} px de lado`);
  }
  const vp = r.pasos[0]?.viewport;
  if (r.pasos.length && vp === null) r.avisos.push("VIEWPORT: sin etiqueta viewport");
  else if (vp && /maximum-scale\s*=\s*1(\.0)?\b|user-scalable\s*=\s*(no|0)/i.test(vp)) r.avisos.push(`VIEWPORT: ${vp}`);
  r.avisos = [...new Set(r.avisos)];
  return r;
}

const resultados = [];
for (let i = 0; i < sitios.length; i += 4) {
  resultados.push(...(await Promise.all(sitios.slice(i, i + 4).map(probar))));
}
await navegador.close();

for (const r of resultados) {
  if (json) { console.log(JSON.stringify(r)); continue; }
  const marca = r.error ? "?" : r.avisos.length ? "✗" : "✓";
  console.log(`${marca} ${r.sitio}${r.error ? "  (no se pudo probar: " + r.error + ")" : ""}  · ${r.pasos.length - 1} cambios de página`);
  for (const a of r.avisos) console.log("    " + a);
}
process.exit(resultados.some((r) => r.avisos.length) ? 1 : 0);
