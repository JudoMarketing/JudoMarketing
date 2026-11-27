// Imprime el informe a PDF y revisa cada página: que nada se salga de su hoja.
//   node scripts/auditoria/presencia/pdf.mjs <informe.html absoluto> <salida.pdf>
// Lo llama armar.py; se corre desde la raíz del repo (ahí vive playwright).
import { createRequire } from "node:module";
const { chromium } = createRequire(process.cwd() + "/")("playwright");
const [, , entrada, salida] = process.argv;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 816, height: 1056 } });
await p.goto("file://" + entrada, { waitUntil: "load" });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(500);
const problemas = await p.evaluate(() => {
  const out = [];
  document.querySelectorAll(".pagina").forEach((pg, i) => {
    const caja = pg.getBoundingClientRect();
    const cont = pg.querySelector(".contenido");
    if (cont && cont.scrollHeight > cont.clientHeight + 1) out.push(`página ${i + 1}: el contenido pide ${cont.scrollHeight - cont.clientHeight}px más de alto`);
    pg.querySelectorAll("*").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      if (getComputedStyle(el).position === "absolute" && el.classList.contains("portada-fondo")) return;
      if (r.right > caja.right + 1 || r.bottom > caja.bottom + 1 || r.left < caja.left - 1) out.push(`página ${i + 1}: <${el.tagName.toLowerCase()} class="${el.className.baseVal ?? el.className}"> se sale (${Math.round(r.right - caja.right)}px der, ${Math.round(r.bottom - caja.bottom)}px abajo)`);
    });
    // Texto que se desborda de su propia caja (cortado)
    pg.querySelectorAll("p, li, h2, h3, h4, td, span, b, small").forEach((el) => {
      if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflow !== "visible") out.push(`página ${i + 1}: texto cortado en <${el.tagName.toLowerCase()}>: ${el.textContent.slice(0, 40)}`);
    });
  });
  const fuentes = [...document.fonts].filter((f) => f.status === "error").map((f) => f.family + " " + f.weight);
  if (fuentes.length) out.push("fuentes sin cargar: " + fuentes.join(", "));
  return [...new Set(out)];
});
console.log(problemas.length ? problemas.join("\n") : "Sin desbordes");
await p.pdf({ path: salida, width: "8.5in", height: "11in", printBackground: true, preferCSSPageSize: true });
await b.close();
