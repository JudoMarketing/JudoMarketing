/**
 * La parte automática de la auditoría de presencia (docs/AUDITORIA-CLIENTES.md):
 * lo que se puede comprobar sin criterio humano. Abre el sitio en un navegador
 * real (escritorio y teléfono, en el idioma del informe) y saca:
 *   - capturas home-desk.jpg y home-tel.jpg (las del PDF);
 *   - medición instalada: GA4, Tag Manager, Google Ads, píxel de Meta,
 *     TikTok, Clarity, Hotjar, Vercel o Cloudflare Analytics, aviso de cookies;
 *   - verificación de Search Console y Bing (meta y TXT en DNS);
 *   - DNS del correo: MX, SPF, DMARC; edad del dominio (RDAP);
 *   - contacto: tel:, WhatsApp, sms:, mailto:, formularios y sus campos, y si
 *     el teléfono se ve en la primera pantalla del teléfono;
 *   - redes enlazadas desde el sitio; privacidad, términos, consentimiento de
 *     SMS; JSON-LD (tipos y legalName); encabezados de seguridad.
 * No llena formularios ni crea cuentas.
 *
 *   node scripts/auditoria/presencia/medir.mjs <dominio> <carpeta> [es|en]
 * Escribe <carpeta>/medicion.json. Se corre desde la raíz del repo.
 */
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
const { chromium, devices } = createRequire(process.cwd() + "/")("playwright");
const [, , dominioArg, carpeta, idioma = "en"] = process.argv;
if (!dominioArg || !carpeta) { console.error("uso: node medir.mjs <dominio> <carpeta> [es|en]"); process.exit(1); }
mkdirSync(carpeta, { recursive: true });
const dominio = dominioArg.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
const url = "https://" + dominio + "/";
const locale = idioma === "es" ? "es-US" : "en-US";

const dns = async (nombre, tipo) => {
  try {
    const r = await (await fetch(`https://dns.google/resolve?name=${nombre}&type=${tipo}`)).json();
    return (r.Answer || []).map((a) => a.data.replace(/^"|"$/g, "").replace(/" "/g, ""));
  } catch { return null; }
};
const rdap = async () => {
  try {
    // rdap.org responde 403 a los robots: se usa el servidor del registro
    // que dice el directorio de IANA.
    const tld = dominio.split(".").pop();
    const boot = await (await fetch("https://data.iana.org/rdap/dns.json")).json();
    const base = boot.services.find((s) => s[0].includes(tld))?.[1]?.[0];
    if (!base) return null;
    const r = await (await fetch(`${base.replace(/\/$/, "")}/domain/${dominio}`)).json();
    const ev = (r.events || []).find((x) => x.eventAction === "registration");
    return ev ? ev.eventDate.slice(0, 10) : null;
  } catch { return null; }
};

const FIRMAS = {
  ga4: /gtag\/js\?id=G-|google-analytics\.com\/g\/collect/,
  tag_manager: /googletagmanager\.com\/gtm\.js/,
  google_ads: /googleadservices\.com|gtag\/js\?id=AW-|googleads\.g\.doubleclick\.net/,
  pixel_meta: /connect\.facebook\.net\/.*fbevents\.js|facebook\.com\/tr\?/,
  tiktok: /analytics\.tiktok\.com/,
  clarity: /clarity\.ms/,
  hotjar: /hotjar\.com/,
  vercel_analytics: /\/_vercel\/insights|va\.vercel-scripts\.com/,
  cloudflare_analytics: /static\.cloudflareinsights\.com/,
  plausible: /plausible\.io/,
};

const b = await chromium.launch();
const pedidas = [];
let ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, locale });
let p = await ctx.newPage();
p.on("request", (r) => pedidas.push(r.url()));
const res = await p.goto(url, { waitUntil: "networkidle", timeout: 60000 }).catch(() => null);
await p.waitForTimeout(2500);
await p.screenshot({ path: `${carpeta}/home-desk.jpg`, type: "jpeg", quality: 85 });
const html = await p.content();
const enPagina = await p.evaluate(() => {
  const a = [...document.querySelectorAll("a[href]")].map((x) => ({ href: x.href, texto: x.innerText.trim().slice(0, 60) }));
  const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].flatMap((s) => { try { const j = JSON.parse(s.textContent); return Array.isArray(j) ? j : j["@graph"] || [j]; } catch { return []; } });
  const formularios = [...document.querySelectorAll("form")].map((f) => ({ campos: [...f.querySelectorAll("input,select,textarea")].filter((i) => !["hidden", "submit", "button"].includes(i.type)).length, accion: f.getAttribute("action") }));
  const cuerpo = document.body.innerText;
  return {
    enlaces: a,
    ld_tipos: ld.map((x) => x["@type"]).flat().filter(Boolean),
    ld_legalName: ld.map((x) => x.legalName).filter(Boolean),
    ld_telefono: ld.map((x) => x.telephone).filter(Boolean),
    formularios,
    meta_google: document.querySelector('meta[name="google-site-verification"]')?.content ? true : false,
    meta_bing: document.querySelector('meta[name="msvalidate.01"]')?.content ? true : false,
    aviso_cookies: /cookie/i.test(cuerpo) && /(accept|aceptar|consent|rechazar|reject)/i.test(cuerpo),
    sms_consentimiento: /(text messages?|sms|mensajes de texto).{0,200}(consent|agree|acepto|autorizo|stop)/is.test(cuerpo),
    palabras: cuerpo.split(/\s+/).filter(Boolean).length,
  };
});
await ctx.close();

// Teléfono: ¿se puede llamar desde la primera pantalla?
ctx = await b.newContext({ ...devices["iPhone 13"], locale });
p = await ctx.newPage();
await p.goto(url, { waitUntil: "networkidle", timeout: 60000 }).catch(() => null);
await p.waitForTimeout(2500);
await p.screenshot({ path: `${carpeta}/home-tel.jpg`, type: "jpeg", quality: 85 });
const telefono = await p.evaluate(() => {
  const alto = innerHeight;
  const visible = (sel) => [...document.querySelectorAll(sel)].some((x) => { const r = x.getBoundingClientRect(); const s = getComputedStyle(x); return r.width > 0 && r.top < alto && r.bottom > 0 && s.visibility !== "hidden" && s.display !== "none"; });
  return { llamar_primera_pantalla: visible('a[href^="tel:"]'), whatsapp_primera_pantalla: visible('a[href*="wa.me"], a[href*="whatsapp"]') };
});
await ctx.close();
await b.close();

const hrefs = enPagina.enlaces.map((x) => x.href);
const redes = {};
for (const [red, re] of Object.entries({ instagram: /instagram\.com\//, facebook: /facebook\.com\//, tiktok: /tiktok\.com\/@/, linkedin: /linkedin\.com\/(company|in)\//, youtube: /youtube\.com\//, x: /(twitter|x)\.com\//, yelp: /yelp\.com\/biz/, google: /(g\.page|maps\.app\.goo\.gl|google\.com\/maps|search\.google\.com\/local)/ })) {
  const h = hrefs.find((x) => re.test(x)); if (h) redes[red] = h;
}
const todo = html + "\n" + pedidas.join("\n");
const medicion = Object.fromEntries(Object.entries(FIRMAS).map(([k, re]) => [k, re.test(todo)]));
const txt = (await dns(dominio, "TXT")) || [];
const cab = res ? res.headers() : {};
const salida = {
  dominio, fecha: new Date().toISOString().slice(0, 10), estado_http: res ? res.status() : null,
  medicion: { ...medicion, aviso_cookies: enPagina.aviso_cookies },
  verificacion: {
    search_console: enPagina.meta_google || txt.some((t) => t.startsWith("google-site-verification")),
    bing: enPagina.meta_bing || txt.some((t) => /^ms=|msvalidate/i.test(t)),
  },
  correo: { mx: await dns(dominio, "MX"), spf: txt.find((t) => t.startsWith("v=spf1")) || null, dmarc: ((await dns("_dmarc." + dominio, "TXT")) || []).find((t) => t.startsWith("v=DMARC1")) || null },
  dominio_registrado: await rdap(),
  contacto: {
    tel: [...new Set(hrefs.filter((h) => h.startsWith("tel:")))],
    whatsapp: [...new Set(hrefs.filter((h) => /wa\.me|whatsapp/.test(h)))],
    sms: [...new Set(hrefs.filter((h) => h.startsWith("sms:")))],
    email: [...new Set(hrefs.filter((h) => h.startsWith("mailto:")).map((h) => h.replace(/\?.*$/, "")))],
    formularios: enPagina.formularios, ...telefono,
  },
  redes_enlazadas: redes,
  legal: {
    privacidad: hrefs.find((h) => /privac/i.test(h)) || null,
    terminos: hrefs.find((h) => /(terms|terminos|términos|condiciones)/i.test(h)) || null,
    sms_consentimiento: enPagina.sms_consentimiento,
  },
  datos_estructurados: { tipos: enPagina.ld_tipos, legalName: enPagina.ld_legalName, telefono: enPagina.ld_telefono },
  seguridad: Object.fromEntries(["strict-transport-security", "content-security-policy", "x-content-type-options", "x-frame-options", "referrer-policy", "permissions-policy"].map((k) => [k, Boolean(cab[k])])),
  palabras_home: enPagina.palabras,
};
writeFileSync(`${carpeta}/medicion.json`, JSON.stringify(salida, null, 1));
console.log(JSON.stringify(salida, null, 1));
