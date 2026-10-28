// Revisa cada lámina antes de entregar:
// - una palabra sola en la última línea, el resaltado partido;
// - texto fuera de los márgenes o pegado al borde;
// - texto encimado, contraste bajo, letra chica para un teléfono;
// - contenido que no cabe y se mete en el pie de la lámina;
// - demasiadas palabras (el titular de la portada, más de 12; una lámina, más de 40).
// Uso: node revisar.mjs [carrusel.html]
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { abrirNavegador, servir } from "./navegador.mjs";

const D = dirname(fileURLToPath(import.meta.url));
const archivo = process.argv.slice(2).find((a) => a.endsWith(".html")) || "carrusel.html";
const web = await servir([D]);
const b = await abrirNavegador();
const p = await b.newPage({ viewport: { width: 1080, height: 1350 }, ignoreHTTPSErrors: true });
await p.goto(`${web.url}/${archivo}?render=1`, { waitUntil: "networkidle" });
await p.evaluate(() => window.listo);
await p.addScriptTag({ path: join(D, "revision-texto.js") });
const res = await p.evaluate(() => {
  const laminas = [...document.querySelectorAll(".lamina")];
  return laminas.map((l, i) => {
    const W = l.getBoundingClientRect().width, H = l.getBoundingClientRect().height, m = W * 0.05;
    const op = {
      minPx: 28,
      zonas: [
        { l: 0, t: 0, r: W, b: m, motivo: "pegado al borde de arriba" }, { l: 0, t: H - m, r: W, b: H, motivo: "pegado al borde de abajo" },
        { l: 0, t: 0, r: m, b: H, motivo: "pegado al borde izquierdo" }, { l: W - m, t: 0, r: W, b: H, motivo: "pegado al borde derecho" },
      ].concat(i === 0 ? [{ l: 0, t: 0, r: W * 0.06, b: H, motivo: "en la portada, fuera del recorte 3:4 de la cuadrícula" }, { l: W * 0.94, t: 0, r: W, b: H, motivo: "en la portada, fuera del recorte 3:4 de la cuadrícula" }] : []),
      otros: "img:not(.foto-fondo img):not(.pie-lamina img):not(.contacto img), .telefono, .numero, .boton",
      grupos: ".fila, .contacto, .pie-lamina, .mal, .bien, .telefono",
      ignorar: ".pie-lamina",
    };
    const r = window.revisarTextos(l, op);
    const cuenta = (sel) => [...l.querySelectorAll(sel)].map((c) => c.textContent.trim().split(/\s+/).filter(Boolean).length).reduce((a, x) => a + x, 0);
    // En la portada manda el titular: 12 palabras como mucho
    if (i === 0 && cuenta(".titular") > 12) r.problemas.push(`el titular de la portada tiene ${cuenta(".titular")} palabras (máximo 12)`);
    if (cuenta(".cuerpo") > 40) r.problemas.push(`tiene ${cuenta(".cuerpo")} palabras (máximo 40): recorta`);
    if (!l.dataset.alt) r.problemas.push("le falta el texto alternativo (data-alt)");
    // Cajas con fondo o borde (botones, chips, recuadros) también respetan los márgenes
    const L = l.getBoundingClientRect();
    for (const x of l.querySelectorAll(".cuerpo *")) {
      const cs = getComputedStyle(x);
      const conFondo = !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor) || parseFloat(cs.borderTopWidth) > 0;
      if (!conFondo || x.closest(".pie-lamina")) continue;
      const r2 = x.getBoundingClientRect();
      if (r2.width === 0) continue;
      if (r2.left - L.left < m - 1 || L.right - r2.right < m - 1) r.problemas.push(`${x.className ? "." + String(x.className).split(" ")[0] : x.tagName.toLowerCase()} queda pegado al borde (a menos de 5 cqw)`);
    }
    // Lo que no cabe en el cuerpo se mete en el pie de la lámina (marca, progreso, «Desliza»)
    for (const c of l.querySelectorAll(".cuerpo")) {
      const limite = c.getBoundingClientRect().bottom + 2;
      const fuera = [...c.querySelectorAll("*")].filter((x) => x.getBoundingClientRect().bottom > limite && x.getBoundingClientRect().height > 0);
      if (fuera.length) r.problemas.push(`no cabe: ${fuera[0].className ? "." + String(fuera[0].className).split(" ")[0] : fuera[0].tagName.toLowerCase()} se mete en el pie de la lámina. Recorta texto o achica la imagen`);
    }
    return { n: i + 1, pieza: l.dataset.pieza || "", problemas: [...new Set(r.problemas)] };
  });
});
await b.close();
web.cerrar();
let total = 0;
for (const r of res) {
  total += r.problemas.length;
  console.log(r.problemas.length ? `${String(r.n).padStart(2, "0")} (${r.pieza}):\n  - ${r.problemas.join("\n  - ")}` : `${String(r.n).padStart(2, "0")}: bien`);
}
const piezas = new Set(res.flatMap((r) => (r.pieza.match(/\d/g) || [])));
const faltan = [..."12345678"].filter((x) => !piezas.has(x));
if (faltan.length) { console.log(`\nFaltan piezas de la estructura: ${faltan.join(", ")} (data-pieza de cada lámina).`); total++; }
console.log(total ? `\n${total} cosas que revisar.${res.some((r) => r.problemas.some((p) => p.includes("queda sola"))) ? "\nPara una palabra sola al final: une las dos últimas palabras con &nbsp; o cambia la frase." : ""}` : "\nSin problemas.");
