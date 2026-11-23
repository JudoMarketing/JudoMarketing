// Saca cada lámina del carrusel como PNG (salida/01.png, 02.png…) y, con
// --pdf, un PDF con todas para LinkedIn (salida/carrusel.pdf).
// Uso: node render.mjs [carrusel.html] [--pdf]
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { abrirNavegador, servir } from "./navegador.mjs";

const D = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const archivo = args.find((a) => a.endsWith(".html")) || "carrusel.html";
const P = join(D, "salida");
mkdirSync(P, { recursive: true });
// Fuera lo de un render anterior (otras láminas, un PDF viejo)
for (const f of readdirSync(P)) if (/^\d\d\.png$/.test(f) || f === "carrusel.pdf" || f === "hoja.jpg") rmSync(join(P, f));

const web = await servir([D]);
const b = await abrirNavegador();
const p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1, ignoreHTTPSErrors: true });
await p.goto(`${web.url}/${archivo}?render=1`, { waitUntil: "networkidle" });
await p.evaluate(() => window.listo);
const { W, H, n } = await p.evaluate(() => {
  const t = document.getElementById("tira");
  const r = t.getBoundingClientRect();
  return { W: r.width / t.querySelectorAll(".lamina").length, H: r.height, n: t.querySelectorAll(".lamina").length };
});
await p.setViewportSize({ width: Math.round(W * n), height: Math.round(H) });
await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
for (let i = 0; i < n; i++) {
  await p.screenshot({ path: join(P, `${String(i + 1).padStart(2, "0")}.png`), clip: { x: i * W, y: 0, width: W, height: H } });
}
await b.close();
web.cerrar();
console.log(`${n} láminas de ${W} × ${H} en salida/`);
if (args.includes("--pdf")) {
  execFileSync("python3", ["-c", `
import glob
from PIL import Image
fs = sorted(glob.glob("${P}/[0-9][0-9].png"))
ims = [Image.open(f).convert("RGB") for f in fs]
ims[0].save("${P}/carrusel.pdf", save_all=True, append_images=ims[1:], resolution=150)
print("PDF:", "${P}/carrusel.pdf")`], { stdio: "inherit" });
}
