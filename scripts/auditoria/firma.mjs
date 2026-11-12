// La firma de la casa: cada sitio hecho por Judo lleva al fondo «Site built by
// Judo Marketing» (o «Sitio creado por Judo Marketing») enlazada a
// judomarketing.net (CEREBRO, sección 2, regla 17).
//
// Un iPhone simulado (390 px) entra a cada sitio, baja hasta el pie y busca el
// enlace. Avisa de:
//   - FALTA: no hay ningún enlace a judomarketing.net con «Judo Marketing»;
//   - OCULTA: está, pero no se ve (sin tamaño, transparente o fuera de la
//     pantalla por el lado);
//   - TEXTO: el enlace está, pero no dice «built by» / «creado por» / «by».
//
// Uso:
//   node scripts/auditoria/firma.mjs                     (los de scripts/seguridad/sitios.txt)
//   node scripts/auditoria/firma.mjs pachypinchos.com hr-gutters.vercel.app
// Sale con código 1 si algún sitio tiene un aviso.
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
let pw;
try { pw = require("playwright"); } catch { pw = createRequire(process.cwd() + "/")("playwright"); }
const { chromium, devices } = pw;

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
let sitios = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (!sitios.length) {
  sitios = readFileSync(join(RAIZ, "scripts/seguridad/sitios.txt"), "utf8").split("\n")
    .map((l) => l.trim()).filter((l) => l && !l.startsWith("#"))
    // El sitio de la casa y sus portales no se firman a sí mismos
    .filter((l) => !l.startsWith("www.judomarketing.net"));
}
const conProtocolo = (s) => (/^https?:\/\//.test(s) ? s : "https://" + s);

const navegador = await chromium.launch({
  proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: "localhost,127.0.0.1" } : undefined,
  args: ["--ignore-certificate-errors"],
});

async function revisar(sitio) {
  const ctx = await navegador.newContext({ ...devices["iPhone 13"], ignoreHTTPSErrors: true, locale: "en-US" });
  const p = await ctx.newPage();
  try {
    const resp = await p.goto(conProtocolo(sitio), { waitUntil: "domcontentloaded", timeout: 60000 });
    if (resp && resp.status() >= 400) return { sitio, aviso: `HTTP ${resp.status()}` };
    await p.waitForTimeout(5000);
    // Bajar poco a poco: hay pies que se arman al llegar
    for (let i = 0; i < 12; i++) {
      await p.evaluate(() => window.scrollBy(0, window.innerHeight));
      await p.waitForTimeout(250);
    }
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await p.waitForTimeout(1200);
    // Hasta 20 segundos: hay portadas con intro (God's Home tarda 12) y la
    // firma entra con ellas.
    let r = { aviso: "FALTA" };
    for (let i = 0; i < 20; i++) {
      r = await p.evaluate(() => {
        const enlaces = [...document.querySelectorAll("a[href*='judomarketing.net']")]
          .filter((a) => /judo\s*marketing/i.test(a.textContent || a.closest("p,div,span")?.textContent || ""));
        if (!enlaces.length) return { aviso: "FALTA" };
        const opacidad = (el) => {
          let o = 1;
          for (let x = el; x && x !== document.documentElement; x = x.parentElement) o *= Number(getComputedStyle(x).opacity);
          return o;
        };
        let suelta = null;
        for (const a of enlaces) {
          const caja = a.getBoundingClientRect();
          const visible = caja.width > 0 && caja.height > 0 && opacidad(a) > 0.2 &&
            caja.left >= -2 && caja.right <= window.innerWidth + 2 && getComputedStyle(a).visibility !== "hidden";
          if (!visible) continue;
          const frase = (a.closest("p,div,span,footer") || a).textContent.replace(/\s+/g, " ").trim();
          // «Prepared by» de un borrador no cuenta: tiene que ser la firma del pie
          if (/(built|made|website|site)\s+by|creado por|hecho por/i.test(frase)) return { aviso: null, frase: frase.slice(-70) };
          suelta = frase.slice(-70);
        }
        return suelta ? { aviso: "TEXTO", frase: suelta } : { aviso: "OCULTA" };
      });
      if (!r.aviso) break;
      await p.waitForTimeout(1000);
    }
    return { sitio, ...r };
  } catch (e) {
    return { sitio, aviso: "ERROR " + String(e.message).split("\n")[0].slice(0, 60) };
  } finally {
    await ctx.close();
  }
}

let malos = 0;
const cola = [...sitios];
await Promise.all([0, 1, 2, 3].map(async () => {
  while (cola.length) {
    const r = await revisar(cola.shift());
    if (r.aviso) malos++;
    console.log(`${r.aviso ? "AVISO" : "ok   "} ${r.sitio.padEnd(40)} ${r.aviso ?? ""} ${r.frase ? "· " + r.frase : ""}`);
  }
}));
await navegador.close();
process.exit(malos ? 1 : 0);
