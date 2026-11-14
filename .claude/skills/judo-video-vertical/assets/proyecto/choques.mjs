// Busca cajas que chocan entre sí en el cuadro final de cada escena (justo
// antes de que salga el panel): tarjetas, chips, teléfonos, sellos.
// Pedido de Junior en la Biblioteca (14 nov 2026): «revisa las escenas
// finales, no cuando se inician, las finales tienen cajas que chocan entre
// sí». revisar.mjs mira texto contra objetos; este mira caja contra caja.
//
// Uso: node choques.mjs [e01 e04 …]   (antes: python3 build.py)
// Deja una foto de cada cuadro final en salida/finales/ para mirarla.
//
// Una caja dentro de otra (un chip dentro de su tarjeta) no cuenta. Lo que se
// encima a propósito lleva la clase «encima» y tampoco cuenta.
import { readFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { servir, abrirNavegador } from "./navegador.mjs";

const D = dirname(fileURLToPath(import.meta.url));
const P = join(D, "salida");
const solo = process.argv.slice(2);
const escenas = JSON.parse(readFileSync(join(P, "escenas.json"), "utf8")).filter((e) => !solo.length || solo.includes(e.id));
const CAJAS = [".tarjeta-pro", ".conver", ".opcion", ".arreglo-g", ".posteado", ".presupuesto", ".meta-chips span", ".informe .portada-i",
  ".sello-99", ".tel-t", ".garantias span", ".cta-boton", ".cta-wa", ".cta-nota", ".kicker-v", ".rubro", ".chip-hora", ".tienda",
  ".tel3d", ".noti-g", ".sin-responder", ".insignia-roja", ".burbuja-bot", ".ficha-n", ".si-no span", ".logo-pro", ".monedas",
  ".reloj-arena", ".rastreo", ".pro-cap .m"].join(", ");
const MARGEN = 4; // px: tocarse a menos de 4 px también es chocar

const web = await servir([P, D]);
const b = await abrirNavegador();
mkdirSync(join(P, "finales"), { recursive: true });
let total = 0;
for (const e of escenas) {
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await p.goto(`${web.url}/video.html?e=${e.id}`, { waitUntil: "networkidle" });
  await p.evaluate(() => window.listo);
  const t = e.dur - 0.6;
  const choques = await p.evaluate(async ({ t, sel, margen }) => {
    for (const a of document.getAnimations()) a.currentTime = t * 1000;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const els = [...document.querySelectorAll(sel)].filter((el) => {
      const cs = getComputedStyle(el), r = el.getBoundingClientRect();
      return r.width > 2 && r.height > 2 && cs.visibility !== "hidden" && parseFloat(cs.opacity) > 0.2 && !el.closest(".pant");
    });
    const nombre = (el) => (el.className.baseVal ?? el.className).split(" ")[0] + (el.textContent.trim() ? ` «${el.textContent.trim().slice(0, 28)}»` : "");
    const out = [];
    for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
      const a = els[i], c = els[j];
      if (a.contains(c) || c.contains(a)) continue;
      if (a.closest(".encima") || c.closest(".encima")) continue;
      if (a.matches(".pro-cap .m") && c.matches(".pro-cap .m")) continue; // líneas del mismo titular
      const ra = a.getBoundingClientRect(), rc = c.getBoundingClientRect();
      const dx = Math.min(ra.right, rc.right) - Math.max(ra.left, rc.left);
      const dy = Math.min(ra.bottom, rc.bottom) - Math.max(ra.top, rc.top);
      if (dx > -margen && dy > -margen) out.push(`${nombre(a)} ↔ ${nombre(c)} (${Math.round(Math.max(dx, 0))}×${Math.round(Math.max(dy, 0))} px)`);
    }
    return out;
  }, { t, sel: CAJAS, margen: MARGEN });
  await p.screenshot({ path: join(P, "finales", `${e.id}.jpg`), type: "jpeg", quality: 85 });
  await p.close();
  console.log(choques.length ? `${e.id}:\n  - ${choques.join("\n  - ")}` : `${e.id}: bien`);
  total += choques.length;
}
await b.close(); web.cerrar?.();
console.log(total ? `\n${total} choques en los cuadros finales.` : "\nNingún choque en los cuadros finales.");
process.exit(0);
