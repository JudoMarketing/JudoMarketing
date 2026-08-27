/**
 * Judo Marketing · El checklist de entrega, ejecutado.
 *
 * Abre un website en un navegador de verdad (escritorio y telefono) y revisa
 * lo que se puede revisar solo del checklist de docs/CEREBRO.md §13. Lo que
 * necesita criterio (si el titular vende, si la foto es real) sigue siendo a
 * mano; esto se encarga de lo que se olvida.
 *
 * Uso:
 *   node scripts/revisar-sitio.mjs https://www.elsitiodelcliente.com
 *   node scripts/revisar-sitio.mjs http://localhost:3000/es --json
 *
 * Sale con codigo 1 si hay alguna FALLA, asi que sirve en un cron o en CI.
 */

import { chromium } from "playwright-core";
import { existsSync } from "node:fs";

/* ── Argumentos ─────────────────────────────────────────────────────── */

const args = process.argv.slice(2);
const json = args.includes("--json");
const url = args.find((a) => !a.startsWith("--"));

if (!url) {
  console.error("Uso: node scripts/revisar-sitio.mjs <url> [--json]");
  process.exit(2);
}

/** El enlace del pie que hace la red de la marca (kit/README.md). */
const CASA = "judomarketing.net";

/** Textos de boton que no dicen que pasa al hacer clic (CEREBRO §2.7). */
const CTA_GENERICOS = [
  "enviar", "submit", "click aqui", "click aquí", "click here", "clic aqui",
  "leer mas", "leer más", "ver mas", "ver más", "learn more", "read more",
  "aqui", "aquí", "mas info", "más info", "more info", "continuar", "next",
];

/* ── Recolector de resultados ───────────────────────────────────────── */

const resultados = [];
const ok = (titulo, detalle = "") => resultados.push({ estado: "ok", titulo, detalle });
const aviso = (titulo, detalle = "") => resultados.push({ estado: "aviso", titulo, detalle });
const falla = (titulo, detalle = "") => resultados.push({ estado: "falla", titulo, detalle });

/* ── Color: contraste WCAG, para no depender de nada ────────────────── */

/**
 * Los colores NO se parsean aqui. Tailwind 4 emite `oklab(... / .8)` y leer
 * numeros sueltos de ahi da valores que no son RGB: es como el checker se
 * inventaba textos sin contraste. La pagina los resuelve con un canvas de 1px
 * (ver `resolverColor` mas abajo) y aqui solo llegan enteros 0-255.
 */
function rgbDe(triple) {
  if (!Array.isArray(triple) || triple.length < 3) return null;
  return { r: triple[0], g: triple[1], b: triple[2] };
}


function luminancia({ r, g, b }) {
  const canal = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

function contraste(a, b) {
  const la = luminancia(a);
  const lb = luminancia(b);
  const [alto, bajo] = la > lb ? [la, lb] : [lb, la];
  return (alto + 0.05) / (bajo + 0.05);
}

/* ── El navegador ───────────────────────────────────────────────────── */

const chromiumLocal = "/opt/pw-browsers/chromium";
const lanzamiento = existsSync(chromiumLocal)
  ? { executablePath: chromiumLocal }
  : { channel: "chrome" };

const navegador = await chromium.launch(lanzamiento);
const contexto = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
const pagina = await contexto.newPage();

const erroresConsola = [];
const peticionesRotas = [];
let bytes = 0;
const imagenesPesadas = [];

pagina.on("console", (m) => {
  if (m.type() === "error") erroresConsola.push(m.text().slice(0, 160));
});
pagina.on("requestfailed", (r) => peticionesRotas.push(`${r.method()} ${r.url().slice(0, 110)}`));
pagina.on("response", async (r) => {
  const largo = Number(r.headers()["content-length"] || 0);
  if (!largo) return;
  bytes += largo;
  const tipo = r.headers()["content-type"] || "";
  if (tipo.startsWith("image/") && largo > 600_000) {
    imagenesPesadas.push(`${Math.round(largo / 1024)} KB · ${r.url().split("/").pop().slice(0, 60)}`);
  }
});

/* ── 1. Carga ───────────────────────────────────────────────────────── */

const arranque = Date.now();
let respuesta;
try {
  respuesta = await pagina.goto(url, { waitUntil: "networkidle", timeout: 45_000 });
} catch (e) {
  falla("El sitio no cargo", String(e.message).slice(0, 160));
  await navegador.close();
  informar();
}
const tardanza = Date.now() - arranque;

const estado = respuesta?.status() ?? 0;
if (estado >= 400) falla(`Respuesta HTTP ${estado}`, url);
else ok(`Responde ${estado}`, `${(tardanza / 1000).toFixed(1)}s hasta red en calma`);

if (tardanza > 6000) aviso("Tarda en quedarse quieto", `${(tardanza / 1000).toFixed(1)}s`);

/* ── 2. Lo que dice la cabecera del documento ───────────────────────── */

const cabecera = await pagina.evaluate(() => {
  const meta = (sel, attr = "content") => document.querySelector(sel)?.getAttribute(attr)?.trim() || "";
  return {
    titulo: document.title.trim(),
    descripcion: meta('meta[name="description"]'),
    ogTitulo: meta('meta[property="og:title"]'),
    ogDescripcion: meta('meta[property="og:description"]'),
    ogImagen: meta('meta[property="og:image"]'),
    viewport: meta('meta[name="viewport"]'),
    idioma: document.documentElement.lang.trim(),
    canonico: meta('link[rel="canonical"]', "href"),
    favicon: !!document.querySelector('link[rel~="icon"]'),
    hreflang: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((l) =>
      l.getAttribute("hreflang")
    ),
    schemas: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent || ""),
  };
});

if (!cabecera.titulo) falla("Sin <title>");
else if (cabecera.titulo.length > 65)
  aviso("Titulo largo", `${cabecera.titulo.length} caracteres, se corta en el buscador`);
else if (cabecera.titulo.split(/\s+/).length < 3)
  aviso("Titulo sin oficio", `"${cabecera.titulo}": falta marca + que hace + donde`);
else ok("Titulo", cabecera.titulo);

if (!cabecera.descripcion) falla("Sin meta description");
else if (cabecera.descripcion.length < 50 || cabecera.descripcion.length > 165)
  aviso("Descripcion fuera de medida", `${cabecera.descripcion.length} caracteres (50 a 165)`);
else ok("Meta description");

const ogFalta = [
  !cabecera.ogTitulo && "og:title",
  !cabecera.ogDescripcion && "og:description",
  !cabecera.ogImagen && "og:image",
].filter(Boolean);
if (ogFalta.length) falla("OpenGraph incompleto", ogFalta.join(", "));
else ok("OpenGraph completo");

if (!cabecera.favicon) aviso("Sin favicon declarado", "puede existir /favicon.ico igual");
else ok("Favicon");

if (!cabecera.idioma) falla("Sin atributo lang en <html>");
else ok(`Idioma declarado: ${cabecera.idioma}`);

if (!cabecera.viewport.includes("width=device-width"))
  falla("Sin viewport de movil", cabecera.viewport || "(vacio)");
else ok("Viewport de movil");

if (!cabecera.canonico) aviso("Sin canonico");
else ok("Canonico", cabecera.canonico);

if (!cabecera.hreflang.length)
  aviso("Sin hreflang", "si el sitio es bilingue, cada idioma necesita el suyo");
else ok(`hreflang: ${cabecera.hreflang.join(", ")}`);

if (!cabecera.schemas.length) {
  falla("Sin JSON-LD", "el rubro pide su schema (CEREBRO §12)");
} else {
  const tipos = [];
  let roto = false;
  for (const bruto of cabecera.schemas) {
    try {
      const dato = JSON.parse(bruto);
      const lista = Array.isArray(dato) ? dato : dato["@graph"] || [dato];
      for (const nodo of lista) if (nodo && nodo["@type"]) tipos.push(String(nodo["@type"]));
    } catch {
      roto = true;
    }
  }
  if (roto) falla("JSON-LD que no parsea");
  else if (cabecera.schemas.length > 1)
    aviso(`${cabecera.schemas.length} bloques de schema`, `un solo bloque por pagina: ${tipos.join(", ")}`);
  else ok("JSON-LD", tipos.join(", "));
}

/* ── 3. Encabezados y contenido ─────────────────────────────────────── */

const contenido = await pagina.evaluate(() => {
  /**
   * Compone `color` sobre `fondo` en un canvas de 1x1 y devuelve el sRGB de
   * verdad: alfa ya resuelto y sin importar en que espacio de color venga
   * escrito. Tailwind 4 emite `oklab(... / .8)`, y leer numeros sueltos de
   * ahi da valores que no son RGB.
   */
  const resolverColor = (color, fondo) => {
    const c = document.createElement("canvas");
    c.width = 1;
    c.height = 1;
    const x = c.getContext("2d", { willReadFrequently: true });
    if (!x) return null;
    x.fillStyle = fondo || "#ffffff";
    x.fillRect(0, 0, 1, 1);
    try {
      x.fillStyle = color;
    } catch {
      return null;
    }
    x.fillRect(0, 0, 1, 1);
    const d = x.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2]];
  };

  const visible = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const h1s = [...document.querySelectorAll("h1")].map((h) => h.textContent.trim());
  const niveles = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) =>
    Number(h.tagName[1])
  );
  const clicables = [...document.querySelectorAll("a[href], button")].filter(visible);
  return {
    h1s,
    niveles,
    textosClicables: clicables.map((el) => (el.innerText || el.textContent || "").trim()).filter(Boolean),
    chicos: clicables
      .filter((el) => getComputedStyle(el).display !== "inline")
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.height < 44 || r.width < 44;
      })
      .map((el) => {
        const r = el.getBoundingClientRect();
        return `${(el.innerText || el.textContent || el.getAttribute("aria-label") || "?").trim().slice(0, 28)} (${Math.round(r.width)}x${Math.round(r.height)})`;
      }),
    casa: [...document.querySelectorAll("a[href]")]
      .filter((a) => a.protocol.startsWith("http") && a.hostname.endsWith("judomarketing.net"))
      .map((a) => ({ rel: a.rel || "", texto: (a.innerText || "").trim() })),
    imagenes: [...document.querySelectorAll("img")].map((img) => ({
      src: (img.currentSrc || img.src || "").split("/").pop()?.slice(0, 50) || "",
      alt: img.getAttribute("alt"),
      mostrado: Math.round(img.getBoundingClientRect().width),
      real: img.naturalWidth,
    })),
    fondo: resolverColor(getComputedStyle(document.body).backgroundColor, "#ffffff"),
    fondoCrudo: getComputedStyle(document.body).backgroundColor,
    parrafos: [...document.querySelectorAll("p, li")]
      .filter(visible)
      .slice(0, 40)
      .map((el) => {
        // El fondo efectivo es el del primer ancestro que pinte uno.
        let fondo = "";
        let conImagen = false;
        for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
          const e = getComputedStyle(n);
          if (e.backgroundImage && e.backgroundImage !== "none") conImagen = true;
          const alfa = (e.backgroundColor.match(/[\d.]+/g) || [])[3];
          if (e.backgroundColor && e.backgroundColor !== "transparent" && alfa !== "0") {
            fondo = e.backgroundColor;
            break;
          }
        }
        const estilo = getComputedStyle(el);
        const fondoBase = resolverColor(fondo || "#ffffff", "#ffffff");
        return {
          // Ya compuesto sobre su fondo: un texto a 65% de opacidad se mide
          // por lo que se ve, no por el color que dice la hoja de estilos.
          color: resolverColor(estilo.color, fondo || "#ffffff"),
          fondo: fondoBase,
          // Texto pintado con degradado: se ve, pero no se mide con esta cuenta.
          medible: !conImagen && estilo.webkitTextFillColor !== "transparent",
          tam: parseFloat(estilo.fontSize),
          texto: (el.innerText || "").trim().slice(0, 40),
        };
      }),
  };
});

if (contenido.h1s.length === 0) falla("Sin H1");
else if (contenido.h1s.length > 1)
  falla(`${contenido.h1s.length} H1 en la misma pagina`, contenido.h1s.map((h) => `"${h.slice(0, 40)}"`).join(" · "));
else {
  const h1 = contenido.h1s[0];
  if (h1.split(/\s+/).length < 3)
    aviso("H1 de una o dos palabras", `"${h1}": el H1 es para vender, el nombre vive en el logo`);
  else ok("Un solo H1", `"${h1.slice(0, 70)}"`);
}

let salto = "";
for (let i = 1; i < contenido.niveles.length; i++) {
  if (contenido.niveles[i] - contenido.niveles[i - 1] > 1) {
    salto = `h${contenido.niveles[i - 1]} → h${contenido.niveles[i]}`;
    break;
  }
}
if (salto) aviso("Encabezados saltados", `${salto}: el orden es el indice del documento`);
else ok("Encabezados en orden");

const genericos = contenido.textosClicables.filter((tx) =>
  CTA_GENERICOS.includes(tx.toLowerCase().replace(/[.!·→\s]+$/g, ""))
);
if (genericos.length)
  aviso("Botones que no dicen que pasa", [...new Set(genericos)].join(" · "));
else ok("Los botones dicen la accion");

/* ── 4. El pie de la casa ───────────────────────────────────────────── */

const esLaCasa =
  new URL(url).hostname.endsWith(CASA) || cabecera.canonico.includes(`//www.${CASA}`);

if (esLaCasa) {
  ok("Es el sitio de la casa", `el enlace del pie a ${CASA} aplica a los sitios de cliente`);
} else if (!contenido.casa.length) {
  falla(`Sin enlace a ${CASA}`, "cada sitio devuelve una señal a la marca (kit/README.md)");
} else {
  const conNofollow = contenido.casa.filter((a) => /nofollow/i.test(a.rel));
  if (conNofollow.length) falla(`Enlace a ${CASA} con nofollow`, "va seguido, sin excepcion");
  else ok(`Enlace a ${CASA}`, contenido.casa[0].texto.slice(0, 60));
}

/* ── 5. Imagenes ────────────────────────────────────────────────────── */

const sinAlt = contenido.imagenes.filter((i) => i.alt === null);
if (sinAlt.length)
  falla(`${sinAlt.length} imagen(es) sin alt`, sinAlt.map((i) => i.src).slice(0, 4).join(" · "));
else ok("Todas las imagenes con alt", `${contenido.imagenes.length} imagenes`);

const gordas = contenido.imagenes.filter((i) => i.mostrado > 0 && i.real > i.mostrado * 2.2);
if (gordas.length)
  aviso(
    `${gordas.length} imagen(es) servidas mas grandes de lo que se ven`,
    gordas.map((i) => `${i.src}: ${i.real}px para ${i.mostrado}px`).slice(0, 4).join(" · ")
  );
else if (contenido.imagenes.length) ok("Imagenes al ancho real de uso");

if (imagenesPesadas.length)
  aviso(`${imagenesPesadas.length} imagen(es) sobre 600 KB`, imagenesPesadas.slice(0, 4).join(" · "));

if (bytes > 3_500_000)
  aviso("Pagina pesada", `${(bytes / 1024 / 1024).toFixed(1)} MB declarados`);
else if (bytes) ok("Peso de la pagina", `${(bytes / 1024 / 1024).toFixed(1)} MB declarados`);

/* ── 6. Color y contraste ───────────────────────────────────────────── */

const fondo = rgbDe(contenido.fondo);
if (fondo) {
  if (fondo.r === 0 && fondo.g === 0 && fondo.b === 0)
    aviso("Fondo negro puro", "oscuro no es negro (CEREBRO §2.1)");
  else if (luminancia(fondo) < 0.006)
    aviso("Fondo casi negro", `${contenido.fondoCrudo}: el texto secundario se hunde`);
  else ok("Fondo", contenido.fondoCrudo);

  const medibles = contenido.parrafos.filter((p) => p.medible && rgbDe(p.color));
  const flojos = medibles
    .map((p) => ({ ...p, razon: contraste(rgbDe(p.color), rgbDe(p.fondo) || fondo) }))
    .filter((p) => p.razon < 4.5);
  const sinMedir = contenido.parrafos.length - medibles.length;
  if (flojos.length) {
    const peor = flojos.sort((a, b) => a.razon - b.razon)[0];
    aviso(
      `${flojos.length} texto(s) bajo 4.5:1 de contraste`,
      `el peor ${peor.razon.toFixed(2)}:1 en "${peor.texto}"`
    );
  } else if (medibles.length) ok("Contraste del texto de lectura", `${medibles.length} medidos`);
  if (sinMedir > 0)
    aviso(
      `${sinMedir} texto(s) sobre imagen o degradado`,
      "el contraste ahi se revisa a ojo, contra el punto mas claro del fondo"
    );
}

/* ── 7. Consola y peticiones ────────────────────────────────────────── */

if (erroresConsola.length)
  aviso(`${erroresConsola.length} error(es) en consola`, erroresConsola.slice(0, 3).join(" · "));
else ok("Consola limpia");

if (peticionesRotas.length)
  falla(`${peticionesRotas.length} peticion(es) rotas`, peticionesRotas.slice(0, 3).join(" · "));

/* ── 8. Telefono ────────────────────────────────────────────────────── */

await pagina.setViewportSize({ width: 390, height: 844 });
await pagina.waitForTimeout(700);

const movil = await pagina.evaluate(() => {
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  return {
    desborde: document.documentElement.scrollWidth - window.innerWidth,
    chicos: [...document.querySelectorAll("a[href], button")]
      .filter(visible)
      .filter((el) => getComputedStyle(el).display !== "inline")
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.height < 44 || r.width < 44;
      })
      .map((el) => (el.innerText || el.getAttribute("aria-label") || "?").trim().slice(0, 24)),
    camposChicos: [...document.querySelectorAll("input, select, textarea")]
      .filter(visible)
      .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 16)
      .map((el) => `${el.name || el.type || "campo"}: ${getComputedStyle(el).fontSize}`),
  };
});

if (movil.desborde > 2)
  falla("Se desborda a lo ancho en telefono", `${movil.desborde}px de mas`);
else ok("Sin desborde horizontal en telefono");

if (movil.chicos.length)
  aviso(`${movil.chicos.length} area(s) tactil bajo 44px`, [...new Set(movil.chicos)].slice(0, 5).join(" · "));
else ok("Areas tactiles de 44px");

if (movil.camposChicos.length)
  falla(
    `${movil.camposChicos.length} campo(s) con letra bajo 16px`,
    `${movil.camposChicos.slice(0, 3).join(" · ")}: el iPhone hace zoom al enfocarlos`
  );
else ok("Campos de formulario a 16px o mas");

/* ── 9. www o pelado ────────────────────────────────────────────────── */

const direccion = new URL(url);
if (!["localhost", "127.0.0.1"].includes(direccion.hostname)) {
  const otro = direccion.hostname.startsWith("www.")
    ? direccion.hostname.slice(4)
    : `www.${direccion.hostname}`;
  try {
    const r = await fetch(`${direccion.protocol}//${otro}${direccion.pathname}`, {
      redirect: "manual",
    });
    if (r.status >= 300 && r.status < 400) ok(`${otro} redirige`, `${r.status} → ${r.headers.get("location") || ""}`);
    else if (r.status === 200)
      falla(`${otro} contesta 200`, "www y pelado sirviendo el mismo sitio compiten entre si");
    else ok(`${otro} no sirve el sitio`, `HTTP ${r.status}`);
  } catch {
    ok(`${otro} no resuelve`, "solo contesta el dominio elegido");
  }
}

await navegador.close();
informar();

/* ── El informe ─────────────────────────────────────────────────────── */

function informar() {
  const fallas = resultados.filter((r) => r.estado === "falla");
  const avisos = resultados.filter((r) => r.estado === "aviso");

  if (json) {
    console.log(JSON.stringify({ url, fallas: fallas.length, avisos: avisos.length, resultados }, null, 2));
    process.exit(fallas.length ? 1 : 0);
  }

  const icono = { ok: "  ok  ", aviso: " aviso", falla: " FALLA" };
  console.log(`\n  ${url}\n`);
  for (const r of resultados) {
    console.log(`${icono[r.estado]}  ${r.titulo}${r.detalle ? `\n          ${r.detalle}` : ""}`);
  }
  console.log(
    `\n  ${fallas.length} falla(s) · ${avisos.length} aviso(s) · ${resultados.length - fallas.length - avisos.length} bien`
  );
  console.log("  Lo que necesita criterio sigue en docs/CEREBRO.md §13.\n");
  process.exit(fallas.length ? 1 : 0);
}
