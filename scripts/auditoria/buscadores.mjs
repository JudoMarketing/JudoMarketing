// ¿Nos encuentran Google, Bing y los buscadores de IA? Mide cada sitio desde
// afuera, como lo ve un buscador, sin ejecutar JavaScript (los robots de IA no
// lo ejecutan: GPTBot, OAI-SearchBot, ClaudeBot y PerplexityBot leen el HTML
// tal cual llega).
//
// Por sitio revisa:
//   - la portada: título, descripción, canónica, hreflang, imagen para
//     compartir, datos estructurados (JSON-LD), verificación de Google y Bing,
//     noindex por error, y cuánto texto hay sin JavaScript;
//   - robots.txt: que exista, que declare el sitemap y que no bloquee a
//     Google, Bing ni a los buscadores de IA;
//   - el sitemap: que exista, cuántas direcciones trae y si lleva hreflang;
//   - que los robots de IA reciban la página (un 403 suele ser el cortafuegos);
//   - www o sin www: que el otro redirija;
//   - llms.txt (opcional: casi ningún buscador lo lee todavía).
//
// Uso:
//   node scripts/auditoria/buscadores.mjs                 (los de scripts/seguridad/sitios.txt)
//   node scripts/auditoria/buscadores.mjs www.judomarketing.net zanoah.shop
//   node scripts/auditoria/buscadores.mjs --json …        (una línea JSON por sitio)
// Sale con código 1 si algún sitio tiene un aviso.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = process.argv.slice(2);
const json = args.includes("--json");
let sitios = args.filter((a) => !a.startsWith("--"));
if (!sitios.length) {
  sitios = readFileSync(join(RAIZ, "scripts/seguridad/sitios.txt"), "utf8").split("\n")
    .map((l) => l.trim()).filter((l) => l && !l.startsWith("#"))
    // Las rutas internas (un portal, un login) no son sitios aparte
    .filter((l) => !/^[^/]+\.[a-z]+\/(?!GeraldMarket)/.test(l));
}

const NAVEGADOR = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
// Los robots de IA que deciden si salimos en sus respuestas (no los de
// entrenamiento). Google y Bing no se prueban así: sus cortafuegos comprueban
// la IP y un Googlebot falso puede salir bloqueado sin que el real lo esté.
const ROBOTS_IA = {
  "OAI-SearchBot": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot",
  "Claude-SearchBot": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-SearchBot/1.0; +claudebot@anthropic.com)",
  "PerplexityBot": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
};
// A quién se le mira en robots.txt. Los de búsqueda tienen que poder entrar;
// los de entrenamiento (GPTBot, ClaudeBot, Google-Extended) se anotan, pero
// bloquearlos es una decisión del dueño, no un error.
const BUSQUEDA = ["Googlebot", "Bingbot", "OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Applebot"];
const ENTRENAMIENTO = ["GPTBot", "ClaudeBot", "Google-Extended", "Applebot-Extended", "CCBot"];

const tmp = mkdtempSync(join(tmpdir(), "buscadores-"));
let n = 0;
function traer(url, ua = NAVEGADOR, { seguir = true } = {}) {
  const cuerpo = join(tmp, `c${++n}`), cab = join(tmp, `h${n}`);
  try {
    const w = execFileSync("curl", ["-s", ...(seguir ? ["-L"] : []), "--max-time", "25", "--compressed", "-A", ua,
      "-o", cuerpo, "-D", cab, "-w", "%{http_code}\t%{url_effective}\t%{content_type}\t%{redirect_url}", url], { encoding: "utf8" });
    const [estado, final, tipo, redirige] = w.split("\t");
    let texto = "";
    try { texto = readFileSync(cuerpo, "utf8"); } catch {}
    let cabeceras = "";
    try { cabeceras = readFileSync(cab, "utf8"); } catch {}
    return { estado: Number(estado), final, tipo: tipo || "", redirige, texto, cabeceras };
  } catch {
    return { estado: 0, final: url, tipo: "", redirige: "", texto: "", cabeceras: "" };
  }
}

const meta = (html, re) => (html.match(re) || [])[1]?.trim() || null;
function leerPortada(html) {
  const cabeza = html.slice(0, 400000);
  const ld = [...cabeza.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].flatMap((m) => {
    try {
      const j = JSON.parse(m[1]);
      const lista = Array.isArray(j) ? j : j["@graph"] ? j["@graph"] : [j];
      return lista.map((x) => [].concat(x["@type"] || "?").join("+"));
    } catch { return ["(JSON-LD roto)"]; }
  });
  const visible = cabeza.replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
  return {
    lang: meta(cabeza, /<html[^>]*\blang=["']?([\w-]+)/i),
    titulo: meta(cabeza, /<title[^>]*>([^<]*)<\/title>/i),
    descripcion: meta(cabeza, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i) || meta(cabeza, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i),
    canonica: meta(cabeza, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i) || meta(cabeza, /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i),
    hreflang: (cabeza.match(/<link[^>]+hreflang=/gi) || []).length,
    ogImagen: Boolean(/<meta[^>]+property=["']og:image["']/i.test(cabeza)),
    jsonld: ld,
    google: /name=["']google-site-verification["']/i.test(cabeza),
    bing: /name=["']msvalidate\.01["']/i.test(cabeza),
    noindex: /<meta[^>]+name=["'](robots|googlebot)["'][^>]+content=["'][^"']*noindex/i.test(cabeza),
    palabras: visible ? visible.split(" ").length : 0,
    h1: (cabeza.match(/<h1[\s>]/gi) || []).length,
  };
}

// robots.txt: ¿este agente tiene prohibida la raíz? Grupo propio si existe; si
// no, el de "*".
function bloqueados(robots, agentes) {
  const grupos = []; let actual = null;
  for (const linea of robots.split("\n").map((l) => l.replace(/#.*/, "").trim()).filter(Boolean)) {
    const [k, ...v] = linea.split(":"); const clave = k.trim().toLowerCase(), valor = v.join(":").trim();
    if (clave === "user-agent") {
      if (!actual || actual.reglas.length) { actual = { agentes: [], reglas: [] }; grupos.push(actual); }
      actual.agentes.push(valor.toLowerCase());
    } else if ((clave === "disallow" || clave === "allow") && actual) actual.reglas.push([clave, valor]);
  }
  const raizProhibida = (g) => {
    const dis = g.reglas.some(([c, v]) => c === "disallow" && (v === "/" || v === "/*"));
    const al = g.reglas.some(([c, v]) => c === "allow" && (v === "/" || v === "/*"));
    return dis && !al;
  };
  return agentes.filter((a) => {
    const propio = grupos.find((g) => g.agentes.includes(a.toLowerCase()));
    const g = propio || grupos.find((x) => x.agentes.includes("*"));
    return g ? raizProhibida(g) : false;
  });
}

function probar(sitio) {
  const base = /^https?:\/\//.test(sitio) ? sitio.replace(/\/$/, "") : "https://" + sitio.replace(/\/$/, "");
  const r = { sitio, avisos: [], notas: [] };
  const portada = traer(base + "/");
  r.estado = portada.estado;
  if (portada.estado !== 200) { r.avisos.push(`La portada responde ${portada.estado || "sin respuesta"}`); return r; }
  const raiz = new URL(portada.final).origin;
  const ruta = new URL(base).pathname.replace(/\/$/, ""); // GitHub Pages: el sitio vive en una carpeta
  const p = leerPortada(portada.texto);
  r.portada = p;
  if (!p.titulo) r.avisos.push("Sin <title>");
  if (!p.descripcion) r.avisos.push("Sin meta description");
  if (!p.canonica) r.avisos.push("Sin canónica");
  if (!p.ogImagen) r.avisos.push("Sin og:image (imagen al compartir)");
  if (!p.jsonld.length) r.avisos.push("Sin datos estructurados (JSON-LD)");
  if (p.jsonld.includes("(JSON-LD roto)")) r.avisos.push("Un JSON-LD no se puede leer");
  if (p.noindex) r.avisos.push("La portada dice noindex: Google no la pone");
  if (/x-robots-tag:[^\n]*noindex/i.test(portada.cabeceras)) r.avisos.push("La cabecera X-Robots-Tag dice noindex");
  if (p.palabras < 120) r.avisos.push(`Sin JavaScript la portada tiene ${p.palabras} palabras: los robots de IA la ven casi vacía`);
  if (p.h1 !== 1) r.notas.push(`${p.h1} h1 en la portada`);
  if (!p.google) r.notas.push("Sin etiqueta de Google en el HTML (puede estar verificado por DNS)");
  if (!p.bing) r.notas.push("Sin etiqueta de Bing en el HTML (puede estar verificado por DNS o importado de Search Console)");

  const robots = traer(raiz + ruta + "/robots.txt");
  const esTexto = robots.estado === 200 && !/html/i.test(robots.tipo) && !/^\s*</.test(robots.texto);
  if (!esTexto) r.avisos.push(robots.estado === 200 ? "robots.txt devuelve una página, no el archivo" : `robots.txt responde ${robots.estado}`);
  const mapas = esTexto ? [...robots.texto.matchAll(/^\s*sitemap:\s*(\S+)/gim)].map((m) => m[1]) : [];
  if (esTexto) {
    const malB = bloqueados(robots.texto, BUSQUEDA);
    if (malB.length) r.avisos.push(`robots.txt bloquea a buscadores: ${malB.join(", ")}`);
    const malE = bloqueados(robots.texto, ENTRENAMIENTO);
    if (malE.length) r.notas.push(`robots.txt no deja entrenar a: ${malE.join(", ")} (decisión del dueño)`);
    if (!mapas.length) r.avisos.push("robots.txt no dice dónde está el sitemap");
  }

  const urlMapa = mapas[0] || raiz + ruta + "/sitemap.xml";
  let mapa = traer(urlMapa);
  let xml = mapa.estado === 200 && /<(urlset|sitemapindex)/i.test(mapa.texto) ? mapa.texto : "";
  if (/<sitemapindex/i.test(xml)) {
    const hijo = (xml.match(/<loc>\s*([^<\s]+)\s*<\/loc>/i) || [])[1];
    mapa = hijo ? traer(hijo) : mapa; xml = /<urlset/i.test(mapa.texto) ? mapa.texto : xml;
  }
  r.sitemap = xml ? { urls: (xml.match(/<loc>/gi) || []).length, hreflang: /hreflang=/i.test(xml), lastmod: /<lastmod>/i.test(xml) } : null;
  if (!xml) r.avisos.push(`Sin sitemap (${urlMapa} responde ${mapa.estado})`);
  else if (p.hreflang && !r.sitemap.hreflang) r.notas.push("La portada tiene hreflang y el sitemap no");

  r.robotsIA = {};
  for (const [nombre, ua] of Object.entries(ROBOTS_IA)) {
    const x = traer(raiz + ruta + "/", ua);
    r.robotsIA[nombre] = x.estado;
    if (x.estado !== 200) r.avisos.push(`${nombre} recibe ${x.estado || "nada"} en la portada (¿cortafuegos?)`);
  }

  const host = new URL(raiz).host;
  if (!/vercel\.app$|github\.io$/.test(host)) {
    const otro = host.startsWith("www.") ? host.slice(4) : "www." + host;
    const x = traer(`https://${otro}/`, NAVEGADOR, { seguir: false });
    const destino = x.redirige ? new URL(x.redirige).host : null;
    if (x.estado && x.estado < 300) r.avisos.push(`${otro} contesta sin redirigir a ${host} (contenido duplicado)`);
    else if (destino && destino !== host) r.notas.push(`${otro} redirige a ${destino}`);
    else if (x.estado === 302 || x.estado === 307) r.notas.push(`${otro} redirige con ${x.estado} (temporal); mejor 301 o 308`);
  }

  const llms = traer(raiz + ruta + "/llms.txt");
  r.llms = llms.estado === 200 && !/html/i.test(llms.tipo) && !/^\s*</.test(llms.texto);
  return r;
}

const resultados = sitios.map(probar);
rmSync(tmp, { recursive: true, force: true });
for (const r of resultados) {
  if (json) { console.log(JSON.stringify(r)); continue; }
  const p = r.portada;
  console.log(`${r.avisos.length ? "✗" : "✓"} ${r.sitio}` + (p ? `  · ${p.palabras} palabras sin JS · JSON-LD: ${p.jsonld.join(", ") || "ninguno"} · sitemap: ${r.sitemap ? r.sitemap.urls + " URLs" + (r.sitemap.hreflang ? " con hreflang" : "") : "no"} · llms.txt: ${r.llms ? "sí" : "no"}` : ""));
  for (const a of r.avisos) console.log("    ✗ " + a);
  for (const a of r.notas) console.log("    · " + a);
}
process.exit(resultados.some((r) => r.avisos.length) ? 1 : 0);
