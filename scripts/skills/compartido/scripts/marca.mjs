// Saca un borrador de la marca de un sitio web: colores, letras, logo y una
// captura de la primera pantalla. Adivina: revisa marca.json antes de usarlo.
// Uso: node marca.mjs https://www.ejemplo.com carpeta-salida
import { mkdirSync, writeFileSync } from "node:fs";
import { abrirNavegador } from "./navegador.mjs";

const [url, salida = "marca"] = process.argv.slice(2);
if (!url) { console.error("Uso: node marca.mjs <url> [carpeta]"); process.exit(1); }
mkdirSync(salida, { recursive: true });

const b = await abrirNavegador();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
await p.goto(url, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
await p.evaluate(() => document.fonts.ready);

const d = await p.evaluate(() => {
  const hex = (c) => {
    const m = c && c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const [r, g, b, a = 1] = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    if (a < 0.5) return null;
    return "#" + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("");
  };
  const css = (el, prop) => (el ? getComputedStyle(el)[prop] : null);
  const familia = (el) => (el ? css(el, "fontFamily").split(",")[0].replace(/["']/g, "").trim() : null);
  const fondo = hex(css(document.body, "backgroundColor")) || hex(css(document.documentElement, "backgroundColor")) || "#ffffff";
  const h1 = document.querySelector("h1, h2");
  const parrafo = document.querySelector("main p, section p, p");
  // El color de acción: el fondo de botón que más superficie ocupa arriba
  const area = {};
  for (const el of document.querySelectorAll("a, button, [role=button]")) {
    const r = el.getBoundingClientRect();
    if (r.width * r.height < 1500 || r.top > 2400) continue;
    const c = hex(css(el, "backgroundColor"));
    if (!c || c === fondo) continue;
    area[c] = (area[c] || 0) + r.width * r.height;
  }
  const botones = Object.entries(area).sort((a, b) => b[1] - a[1]).map(([c]) => c);
  const logos = [...document.querySelectorAll("header img, nav img, header svg, a[href='/'] img, img[alt*=logo i], img[src*=logo i], img[class*=logo i], [class*=logo i] svg")]
    .filter((e) => { const r = e.getBoundingClientRect(); return r.width > 24 && r.height > 12 && r.top < 320; });
  if (logos[0]) logos[0].setAttribute("data-marca-logo", "1");
  return {
    titulo: document.title,
    themeColor: document.querySelector("meta[name=theme-color]")?.content || null,
    ogImage: document.querySelector("meta[property='og:image']")?.content || null,
    fondo, texto: hex(css(parrafo || document.body, "color")), titulares: hex(css(h1, "color")),
    botones, display: familia(h1), cuerpo: familia(parrafo || document.body), hayLogo: Boolean(logos[0]),
  };
});

await p.screenshot({ path: `${salida}/sitio.png` });
if (d.hayLogo) await p.locator("[data-marca-logo='1']").first().screenshot({ path: `${salida}/logo.png`, omitBackground: true }).catch(() => {});
await b.close();

const lum = (h) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contraste = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const mover = (h, k) => "#" + [1, 3, 5].map((i) => Math.max(0, Math.min(255, Math.round(parseInt(h.slice(i, i + 2), 16) + k)))).map((x) => x.toString(16).padStart(2, "0")).join("");
const oscuro = lum(d.fondo) < 0.2;
const acento = d.botones[0] || d.themeColor || "#7b2dff";
const borrador = {
  nombre: (d.titulo || "").split(/[|·•\-–—:]/)[0].trim(),
  fondo: d.fondo,
  superficie: mover(d.fondo, oscuro ? 14 : -10),
  texto: d.texto || (oscuro ? "#f5f5f7" : "#141414"),
  acento,
  "acento-texto": contraste("#ffffff", acento) >= contraste("#141414", acento) ? "#ffffff" : "#141414",
  primario: d.botones[1] || acento,
  "fuente-display": d.display || "Archivo",
  "fuente-cuerpo": d.cuerpo || "Inter",
  logo: d.hayLogo ? "logo.png" : null,
  contacto: {},
  _lo_que_vi: d,
};
writeFileSync(`${salida}/marca.json`, JSON.stringify(borrador, null, 2));
console.log(`marca.json, sitio.png${d.hayLogo ? " y logo.png" : ""} en ${salida}/. Revísalos: el script adivina.`);
