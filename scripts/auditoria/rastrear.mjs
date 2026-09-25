/**
 * Rastreo de judomarketing.net: el sitemap más los enlaces internos (dos
 * niveles). Por cada página: estado, título, descripción, canónica,
 * hreflang, h1, palabras, imágenes sin alt, datos estructurados, enlaces; y
 * qué enlaces externos responden mal. Es la parte "SEO técnico" de la
 * auditoría semanal (docs/AUDITORIA-RUTINA.md).
 *
 *   node scripts/auditoria/rastrear.mjs [--salida /ruta/rastreo.json]
 */
const ORIGEN = "https://www.judomarketing.net";
const SALIDA = (() => { const i = process.argv.indexOf("--salida"); return i >= 0 ? process.argv[i + 1] : "rastreo.json"; })();
const UA = "Mozilla/5.0 (compatible; JudoAudit/1.0)";
const vistos = new Map();
const cola = [];
const semilla = (await (await fetch(ORIGEN + "/sitemap.xml")).text()).match(/<loc>([^<]+)<\/loc>/g).map((x) => x.replace(/<\/?loc>/g, ""));
for (const u of [...semilla, ORIGEN + "/juditos", ORIGEN + "/juditoads", ORIGEN + "/pay", ORIGEN + "/es/pagar", ORIGEN + "/intake", ORIGEN + "/es/intake", ORIGEN + "/showcase", ORIGEN + "/judimental"]) cola.push({ url: u, nivel: 0 });
const texto = (h) => h.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const meta = (h, n) => (h.match(new RegExp(`<meta[^>]+(?:name|property)=["']${n}["'][^>]+content=["']([^"']*)["']`, "i")) || h.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${n}["']`, "i")) || [])[1] ?? "";
const externos = new Map();
while (cola.length) {
  const { url, nivel } = cola.shift();
  const limpio = url.split("#")[0].replace(/\/$/, "") || ORIGEN;
  if (vistos.has(limpio)) continue;
  let res, html = "";
  try {
    res = await fetch(limpio, { headers: { "User-Agent": UA }, redirect: "manual" });
    html = (res.headers.get("content-type") || "").includes("html") ? await res.text() : "";
  } catch (e) { vistos.set(limpio, { url: limpio, status: 0, error: e.message }); continue; }
  const fila = { url: limpio, status: res.status, redirect: res.headers.get("location") || null, nivel };
  if (html) {
    fila.title = (html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] ?? "";
    fila.description = meta(html, "description");
    fila.canonical = (html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i) || [])[1] ?? "";
    fila.robots = meta(html, "robots");
    fila.ogImage = meta(html, "og:image");
    fila.ogTitle = meta(html, "og:title");
    fila.lang = (html.match(/<html[^>]+lang=["']([^"']+)/i) || [])[1] ?? "";
    fila.hreflang = (html.match(/hreflang=["'][^"']+["']/gi) || []).length;
    fila.h1 = (html.match(/<h1[^>]*>[\s\S]*?<\/h1>/gi) || []).map((x) => texto(x)).slice(0, 3);
    fila.h2 = (html.match(/<h2[^>]*>[\s\S]*?<\/h2>/gi) || []).length;
    const t = texto(html);
    fila.palabras = t.split(" ").length;
    const imgs = html.match(/<img[^>]*>/gi) || [];
    fila.imagenes = imgs.length;
    fila.imgSinAlt = imgs.filter((i) => !/alt=["'][^"']+["']/i.test(i)).length;
    fila.jsonld = (html.match(/"@type":"([A-Za-z]+)"/g) || []).map((x) => x.split(":")[1].replace(/"/g, ""));
    fila.formularios = (html.match(/<form/gi) || []).length;
    fila.tel = (html.match(/href=["']tel:/gi) || []).length;
    fila.wa = (html.match(/wa\.me|whatsapp/gi) || []).length;
    const enlaces = [...html.matchAll(/href=["']([^"'#]+)["']/gi)].map((m) => m[1]);
    fila.enlacesInternos = 0; fila.enlacesExternos = 0;
    for (const e of enlaces) {
      let u; try { u = new URL(e, limpio); } catch { continue; }
      if (u.hostname === "www.judomarketing.net") { fila.enlacesInternos++; if (nivel < 2 && !/^\/(api|_next)\//.test(u.pathname) && !/\.(png|jpg|svg|pdf|ico|webp|xml|txt)$/i.test(u.pathname)) cola.push({ url: u.origin + u.pathname, nivel: nivel + 1 }); }
      else if (/^https?:$/.test(u.protocol)) { fila.enlacesExternos++; if (!externos.has(u.href)) externos.set(u.href, limpio); }
    }
  }
  vistos.set(limpio, fila);
}
// Enlaces externos: ¿responden?
const ext = [];
await Promise.all([...externos.entries()].slice(0, 80).map(async ([u, desde]) => {
  try { const r = await fetch(u, { method: "GET", headers: { "User-Agent": UA }, redirect: "follow", signal: AbortSignal.timeout(12000) }); ext.push({ url: u, desde, status: r.status }); }
  catch (e) { ext.push({ url: u, desde, status: 0, error: e.name }); }
}));
const paginas = [...vistos.values()];
await import("node:fs/promises").then((fs) => fs.writeFile(SALIDA, JSON.stringify({ paginas, externos: ext }, null, 2)));
console.log(`páginas: ${paginas.length}`);
for (const p of paginas) console.log(`${p.status} ${p.url.replace(ORIGEN, "") || "/"} | t=${(p.title || "").length} d=${(p.description || "").length} h1=${(p.h1 || []).length} pal=${p.palabras ?? "-"} img=${p.imagenes ?? "-"}/${p.imgSinAlt ?? "-"}sinalt canon=${p.canonical ? (p.canonical === p.url || p.canonical === p.url + "/" ? "ok" : p.canonical) : "NO"} robots=${p.robots || "-"} og=${p.ogImage ? "sí" : "NO"} ld=${(p.jsonld || []).join(",") || "-"}${p.redirect ? " -> " + p.redirect : ""}`);
console.log("\nexternos rotos:"); for (const e of ext.filter((x) => x.status >= 400 || x.status === 0)) console.log(` ${e.status} ${e.url} (desde ${e.desde.replace(ORIGEN, "")})`);
console.log(`externos revisados: ${ext.length}`);
