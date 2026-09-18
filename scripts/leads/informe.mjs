#!/usr/bin/env node
/**
 * Informe de presencia en línea: una página en PDF con lo que Google ve hoy
 * de un negocio que ya tiene website. Va adjunto al correo de prospección.
 *
 * Todo es público y real: lo que Google mide de su página (PageSpeed
 * Insights), en qué puesto sale en Google Maps para una búsqueda de su zona
 * y quiénes van delante, su puesto en la búsqueda web (si está configurado
 * el buscador programable), y lo que se ve en su propio sitio (título,
 * descripción, celular, candado, datos estructurados, sitemap, redes,
 * antigüedad del dominio). Lo que no se pudo medir se dice "no disponible";
 * nunca se inventa.
 *
 *   node scripts/leads/informe.mjs --leads leads.json[,sunbiz.json] --ids id1,id2 --salida <carpeta>
 *   node scripts/leads/informe.mjs --url https://negocio.com --nombre "Negocio" --zip 33131 --salida <carpeta> [--sin-api]
 *
 * Deja <carpeta>/<negocio>.pdf por cada uno y <carpeta>/informes.json con los
 * números que la sesión puede citar en el correo.
 *
 * Entorno: LEADS_SECRET (salvo --sin-api), LEADS_SITE (opcional),
 * PLAYWRIGHT_CHROMIUM (opcional, ruta al Chromium).
 */

import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { chromium } from "playwright-core";
import { api, traer, textoVisible, meta } from "./buscar.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, "..", "..");

// ------------------------------------------------------------ argumentos

function args() {
  const a = process.argv.slice(2);
  const leer = (k, d) => {
    const i = a.indexOf(k);
    return i >= 0 ? a[i + 1] : d;
  };
  return {
    leads: leer("--leads"),
    ids: (leer("--ids", "") || "").split(",").filter(Boolean),
    url: leer("--url"),
    nombre: leer("--nombre"),
    zip: leer("--zip"),
    idioma: leer("--idioma"),
    salida: leer("--salida"),
    sinApi: a.includes("--sin-api"),
  };
}

// --------------------------------------------------------------- textos

const T = {
  es: {
    titulo: "Informe de presencia en línea",
    preparado: "Preparado para",
    fecha: "Datos públicos del",
    velocidad: "Velocidad en celular",
    seo: "SEO técnico",
    maps: "Puesto en Google Maps",
    resenas: "Reseñas en Google",
    de100: "de 100 según Google",
    noAparece: "No aparece",
    entre: (n) => `entre los ${n} primeros`,
    sinDatos: "no disponible",
    encuentran: "Cómo te encuentran",
    busqueda: "Búsqueda",
    puesto: "Puesto",
    web: "Búsqueda web de Google",
    primeros: "Los tres primeros de tu zona",
    tu: "Tu negocio",
    negocio: "Negocio",
    pagina: "Tu página web",
    carga: "Tiempo hasta ver el contenido principal (LCP)",
    estabilidad: "Estabilidad visual (CLS)",
    bloqueo: "Tiempo bloqueado por scripts (TBT)",
    dominio: "Dominio registrado desde",
    chequeos: {
      titulo: "Título de página para Google",
      meta_descripcion: "Descripción para los resultados de Google",
      h1: "Encabezado principal",
      viewport: "Se adapta al celular",
      https: "Conexión segura (candado)",
      alt_imagenes: "Imágenes descritas para Google",
      datos_estructurados: "Datos del negocio en formato Google (schema)",
      sitemap: "Mapa del sitio (sitemap.xml)",
      robots: "Instrucciones para Google (robots.txt)",
      contacto: "Llamada o WhatsApp con un toque",
      redes: "Enlace a Instagram o Facebook",
      pedidos: "Pedidos, reservas o citas en línea",
    },
    primero: "Lo primero que haríamos",
    regaloTitulo: "Un regalo por trabajar con nosotros",
    regalo: "Al contratar cualquiera de nuestros servicios, configuramos y optimizamos tu Perfil de Empresa de Google sin costo: categorías, fotos, horarios, servicios, publicaciones y respuesta a reseñas. Es lo primero que ve un cliente cuando te busca, y lo dejamos listo antes que nada.",
    cta: "Agenda 20 minutos con Junior en",
    fuente: "Fuentes: PageSpeed Insights de Google, Google Maps (Places), la búsqueda de Google y el propio sitio del negocio. Medición automática, sin acceso a cuentas privadas. Los puestos en Google varían según desde dónde y desde qué aparato se busque.",
    rec: {
      lento: (s) => `Tu página tarda ${s} en mostrar lo principal en un celular. Google recomienda menos de 2,5 segundos; con más de 4, buena parte de la gente se va antes de ver nada.`,
      sinTitulo: "Google no tiene con qué presentarte: el título o la descripción que salen en los resultados faltan o son demasiado cortos. Es lo más barato de arreglar y lo que más cambia el clic.",
      sinCelular: "La página no se adapta al celular, y más de 7 de cada 10 búsquedas locales se hacen desde uno.",
      sinHttps: "La página no tiene candado (HTTPS). El navegador la marca como no segura y Google la relega.",
      sinMaps: (q) => `Para «${q}» no apareces entre los 20 primeros de Google Maps. Ahí es donde busca quien ya quiere comprar hoy.`,
      mapsBajo: (q, n) => `Para «${q}» sales en el puesto ${n} de Google Maps. Los tres primeros se llevan la mayoría de las llamadas.`,
      resenas: (tuyas, ellos) => `Tienes ${tuyas} reseñas; los tres primeros de tu zona promedian ${ellos}. Las reseñas son el factor que más pesa en Maps y se pueden pedir con un sistema.`,
      sinSchema: "Tu sitio no le dice a Google en su formato qué negocio eres, dónde estás ni tus horarios (datos estructurados). Sin eso compites con desventaja en los resultados locales.",
      sinPedidos: "No hay forma de pedir, reservar o agendar en la página: cada cliente tiene que llamar. Una página que cierra sola trabaja las 24 horas.",
      sinContacto: "No hay botón de llamada ni WhatsApp: en celular, cada clic de más pierde clientes.",
      sinWeb: (q) => `Para «${q}» tu página no aparece en las dos primeras páginas de la búsqueda web de Google.`,
      bien: "Tu presencia está por encima de la media de tu zona. Lo que sigue es convertir esas visitas en pedidos y citas sin depender del teléfono.",
    },
  },
  en: {
    titulo: "Online presence report",
    preparado: "Prepared for",
    fecha: "Public data as of",
    velocidad: "Mobile speed",
    seo: "Technical SEO",
    maps: "Rank on Google Maps",
    resenas: "Google reviews",
    de100: "out of 100, per Google",
    noAparece: "Not listed",
    entre: (n) => `within the top ${n}`,
    sinDatos: "not available",
    encuentran: "How people find you",
    busqueda: "Search",
    puesto: "Rank",
    web: "Google web search",
    primeros: "Top three in your area",
    tu: "Your business",
    negocio: "Business",
    pagina: "Your website",
    carga: "Time to show the main content (LCP)",
    estabilidad: "Visual stability (CLS)",
    bloqueo: "Time blocked by scripts (TBT)",
    dominio: "Domain registered since",
    chequeos: {
      titulo: "Page title for Google",
      meta_descripcion: "Description shown in Google results",
      h1: "Main heading",
      viewport: "Adapts to phones",
      https: "Secure connection (padlock)",
      alt_imagenes: "Images described for Google",
      datos_estructurados: "Business data in Google's format (schema)",
      sitemap: "Sitemap (sitemap.xml)",
      robots: "Instructions for Google (robots.txt)",
      contacto: "One-tap call or WhatsApp",
      redes: "Link to Instagram or Facebook",
      pedidos: "Online orders, bookings or appointments",
    },
    primero: "What we would do first",
    regaloTitulo: "A gift for working with us",
    regalo: "When you sign up for any of our services, we set up and optimize your Google Business Profile at no cost: categories, photos, hours, services, posts and review replies. It's the first thing a customer sees when they search for you, and we get it ready before anything else.",
    cta: "Book 20 minutes with Junior at",
    fuente: "Sources: Google PageSpeed Insights, Google Maps (Places), Google Search and the business's own website. Automated measurement, no access to private accounts. Google rankings vary by location and device.",
    rec: {
      lento: (s) => `Your page takes ${s} to show its main content on a phone. Google recommends under 2.5 seconds; past 4, a good share of visitors leave before seeing anything.`,
      sinTitulo: "Google has nothing to introduce you with: the title or the description shown in results is missing or too short. It's the cheapest fix and the one that changes clicks the most.",
      sinCelular: "The page doesn't adapt to phones, and more than 7 out of 10 local searches happen on one.",
      sinHttps: "The page has no padlock (HTTPS). Browsers flag it as not secure and Google pushes it down.",
      sinMaps: (q) => `For "${q}" you're not in the top 20 on Google Maps. That's where people who want to buy today are looking.`,
      mapsBajo: (q, n) => `For "${q}" you rank #${n} on Google Maps. The top three take most of the calls.`,
      resenas: (tuyas, ellos) => `You have ${tuyas} reviews; the top three in your area average ${ellos}. Reviews are the heaviest factor on Maps, and a system can ask for them.`,
      sinSchema: "Your site doesn't tell Google, in its own format, what business you are, where you are or your hours (structured data). Without it you compete at a disadvantage in local results.",
      sinPedidos: "There's no way to order, book or schedule on the page: every customer has to call. A page that closes on its own works around the clock.",
      sinContacto: "No call button or WhatsApp: on a phone, every extra tap loses customers.",
      sinWeb: (q) => `For "${q}" your page doesn't show up in the first two pages of Google web search.`,
      bien: "Your presence is above average for your area. The next step is turning those visits into orders and bookings without depending on the phone.",
    },
  },
};

// ------------------------------------------------------------ auditoría

async function existe(url) {
  try {
    const r = await fetch(url, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(8000), headers: { "User-Agent": "Mozilla/5.0 (compatible; JudoMarketing/1.0; +https://www.judomarketing.net)" } });
    const ct = r.headers.get("content-type") ?? "";
    return r.ok && !/html/i.test(ct);
  } catch {
    return false;
  }
}

async function antiguedadDominio(dominio) {
  try {
    const r = await fetch(`https://rdap.org/domain/${dominio}`, {
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
      headers: { Accept: "application/rdap+json, application/json", "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36" },
    });
    if (!r.ok) return null;
    const d = await r.json();
    const ev = (d.events ?? []).find((e) => e.eventAction === "registration");
    return ev?.eventDate?.slice(0, 10) ?? null;
  } catch {
    return null;
  }
}

export async function auditar(url) {
  const pag = await traer(url);
  if (!pag.ok || !pag.html) return { ok: false, estado: pag.estado, error: pag.error ?? null, url };
  const html = pag.html;
  const texto = textoVisible(html);
  const origen = new URL(pag.url).origin;
  const dominio = new URL(pag.url).hostname.replace(/^www\./, "");
  const titulo = textoVisible((html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] ?? "");
  const descripcion = meta(html, "description");
  const h1 = (html.match(/<h1[\s>]/gi) || []).length;
  const imgs = html.match(/<img\b[^>]*>/gi) || [];
  const sinAlt = imgs.filter((i) => !/\balt\s*=\s*["'][^"']+["']/i.test(i)).length;
  const jsonld = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).join(" ");
  const schema = /"@type"\s*:\s*"?(LocalBusiness|Restaurant|Store|Dentist|Physician|MedicalBusiness|AutoRepair|HairSalon|BeautySalon|HomeAndConstructionBusiness|Organization|ProfessionalService|FoodEstablishment)/i.test(jsonld);
  const lang = (html.match(/<html[^>]+lang=["']([a-z]{2})/i) || [])[1] ?? null;
  const [sitemap, robots, dominioDesde] = await Promise.all([existe(`${origen}/sitemap.xml`), existe(`${origen}/robots.txt`), antiguedadDominio(dominio)]);
  return {
    ok: true,
    url: pag.url,
    dominio,
    titulo,
    descripcion,
    idioma: lang,
    chequeos: {
      titulo: titulo.length >= 10,
      meta_descripcion: descripcion.length >= 50,
      h1: h1 >= 1,
      viewport: /<meta[^>]+viewport/i.test(html),
      https: pag.url.startsWith("https://"),
      alt_imagenes: imgs.length === 0 || sinAlt / imgs.length < 0.3,
      datos_estructurados: schema,
      sitemap,
      robots,
      contacto: /href=["'](tel:|https?:\/\/(wa\.me|api\.whatsapp\.com))/i.test(html),
      redes: /instagram\.com\/|facebook\.com\//i.test(html),
      pedidos: /order online|pedir en l|ordena|reserv|book (now|online|a table|an appointment)|appointment|agenda|cita|schedule|cart|carrito|checkout|comprar/i.test(texto),
    },
    imagenes: { total: imgs.length, sin_alt: sinAlt },
    dominio_desde: dominioDesde,
  };
}

// ---------------------------------------------------------- consultas

const CONSULTA_POR_RUBRO = {
  restaurante: "restaurant",
  "taller o automotriz": "auto repair",
  "salon o estetica": "hair salon",
  "limpieza o mantenimiento": "cleaning service",
  "contratista o construccion": "contractor",
  "clinica o salud": "clinic",
  "gimnasio o academia": "gym",
  "transporte o logistica": "moving company",
  "tienda o comercio": "store",
  "mayorista o distribucion": "wholesale",
  "servicios profesionales": "services",
};

function consultaDe(lead) {
  if (lead.tipo_google) return lead.tipo_google.replace(/_/g, " ").replace(/\bstore\b$/, "store");
  return CONSULTA_POR_RUBRO[lead.rubro] ?? "business";
}

// ------------------------------------------------------- recomendaciones

function recomendar(t, datos) {
  const r = [];
  const ps = datos.pagespeed;
  const lcp = ps?.metricas?.lcp;
  const segundos = lcp ? parseFloat(String(lcp).replace(",", ".")) : null;
  if (ps?.puntajes?.rendimiento != null && ps.puntajes.rendimiento < 50 && lcp) r.push(t.rec.lento(lcp));
  else if (segundos && segundos > 4) r.push(t.rec.lento(lcp));
  const c = datos.auditoria?.chequeos ?? {};
  if (c.titulo === false || c.meta_descripcion === false) r.push(t.rec.sinTitulo);
  if (c.viewport === false) r.push(t.rec.sinCelular);
  if (c.https === false) r.push(t.rec.sinHttps);
  const m = datos.maps?.[0];
  if (m && m.posicion == null && m.revisados >= 10) r.push(t.rec.sinMaps(m.etiqueta));
  else if (m && m.posicion > 3) r.push(t.rec.mapsBajo(m.etiqueta, m.posicion));
  if (m?.primeros?.length && datos.resenas != null) {
    const prom = Math.round(m.primeros.reduce((s, p) => s + (p.resenas ?? 0), 0) / m.primeros.length);
    if (prom > datos.resenas * 2 && prom >= 20) r.push(t.rec.resenas(datos.resenas, prom));
  }
  if (c.datos_estructurados === false) r.push(t.rec.sinSchema);
  if (c.pedidos === false) r.push(t.rec.sinPedidos);
  if (c.contacto === false) r.push(t.rec.sinContacto);
  if (datos.web?.configurado && datos.web.posicion == null && datos.web.revisados >= 10) r.push(t.rec.sinWeb(datos.web.consulta));
  if (r.length === 0) r.push(t.rec.bien);
  return r.slice(0, 3);
}

// ------------------------------------------------------------- plantilla

function color(n) {
  if (n == null) return "#8a8a9c";
  return n >= 90 ? "#1f9d55" : n >= 50 ? "#d9930d" : "#d64545";
}
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function html(t, d, logoB64, idioma) {
  const ps = d.pagespeed;
  const m1 = d.maps?.[0];
  const puestoMaps = m1 ? (m1.posicion ? `#${m1.posicion}` : t.noAparece) : t.sinDatos;
  const puestoSub = m1 ? (m1.posicion ? `${t.entre(m1.revisados)} · ${esc(m1.etiqueta)}` : `${t.entre(m1.revisados)} · ${esc(m1.etiqueta)}`) : "";
  const resenas = d.resenas != null ? `${d.rating ?? "?"} ★` : t.sinDatos;
  const resenasSub = d.resenas != null ? `${d.resenas} ${idioma === "es" ? "reseñas" : "reviews"}` : "";
  const tile = (titulo, valor, sub, col) => {
    const texto = String(valor);
    const tam = /^[#\d.,★ ]+$/.test(texto) ? 26 : texto.length > 12 ? 13 : 18;
    return `<div class="tile"><div class="tt">${titulo}</div><div class="tv" style="color:${col};font-size:${tam}px;min-height:32px;display:flex;align-items:center">${texto}</div><div class="ts">${sub}</div></div>`;
  };
  const chequeo = (k) => {
    const v = d.auditoria?.chequeos?.[k];
    const icono = v === true ? '<span class="ok">✓</span>' : v === false ? '<span class="no">✗</span>' : '<span class="nd">·</span>';
    return `<li>${icono} ${t.chequeos[k]}</li>`;
  };
  const filasMaps = (d.maps ?? []).map((m) => `<tr><td>${esc(m.etiqueta)}</td><td class="r">${m.posicion ? `#${m.posicion} ${t.entre(m.revisados)}` : `${t.noAparece} (${t.entre(m.revisados)})`}</td></tr>`).join("");
  const filaWeb = d.web?.configurado ? `<tr><td>${t.web}: ${esc(d.web.consulta)}</td><td class="r">${d.web.posicion ? `#${d.web.posicion}` : `${t.noAparece} (${t.entre(d.web.revisados)})`}</td></tr>` : "";
  const comp = m1?.primeros?.length
    ? `<table class="comp"><tr><th>${t.primeros}</th><th class="r">★</th><th class="r">${idioma === "es" ? "Reseñas" : "Reviews"}</th></tr>
      ${m1.primeros.map((p) => `<tr><td>${esc(p.nombre)}</td><td class="r">${p.rating ?? "?"}</td><td class="r">${p.resenas ?? "?"}</td></tr>`).join("")}
      <tr class="tu"><td>${t.tu}: ${esc(d.nombre)}</td><td class="r">${d.rating ?? "?"}</td><td class="r">${d.resenas ?? "?"}</td></tr></table>`
    : "";
  const metricas = ps
    ? `<table class="comp"><tr><td>${t.carga}</td><td class="r">${esc(ps.metricas.lcp ?? t.sinDatos)}</td></tr>
       <tr><td>${t.estabilidad}</td><td class="r">${esc(ps.metricas.cls ?? t.sinDatos)}</td></tr>
       <tr><td>${t.bloqueo}</td><td class="r">${esc(ps.metricas.tbt ?? t.sinDatos)}</td></tr>
       ${d.auditoria?.dominio_desde ? `<tr><td>${t.dominio}</td><td class="r">${d.auditoria.dominio_desde.slice(0, 4)}</td></tr>` : ""}</table>`
    : d.auditoria?.dominio_desde
      ? `<table class="comp"><tr><td>${t.dominio}</td><td class="r">${d.auditoria.dominio_desde.slice(0, 4)}</td></tr></table>`
      : "";
  const contacto = idioma === "es" ? "www.judomarketing.net/es/contacto" : "www.judomarketing.net/contact";
  return `<!doctype html><html lang="${idioma}"><head><meta charset="utf-8">
<style>
  @page { size: Letter; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #1b1b24; font-size: 11.5px; line-height: 1.45; }
  .cab { background: #0b0b12; color: #f5f5f7; padding: 26px 40px 22px; display: flex; align-items: center; justify-content: space-between; }
  .cab img { width: 54px; height: 54px; }
  .cab .marca { display: flex; align-items: center; gap: 12px; }
  .cab .marca b { font-size: 15px; display: block; }
  .cab .marca span { font-size: 10px; color: #a0a0b4; }
  .cab .tit { text-align: right; }
  .cab .tit b { font-size: 17px; display: block; color: #d9b8ff; }
  .cab .tit span { font-size: 10px; color: #a0a0b4; }
  .neg { padding: 18px 40px 6px; }
  .neg .n { font-size: 22px; font-weight: bold; }
  .neg .u { color: #6b6b7a; font-size: 11px; }
  .tiles { display: flex; gap: 12px; padding: 10px 40px 4px; }
  .tile { flex: 1; border: 1px solid #e4e4ec; border-radius: 12px; padding: 12px 14px; }
  .tt { font-size: 10px; color: #6b6b7a; text-transform: uppercase; letter-spacing: .3px; }
  .tv { font-size: 26px; font-weight: bold; margin: 2px 0; }
  .ts { font-size: 9.5px; color: #8a8a9c; }
  .cols { display: flex; gap: 24px; padding: 10px 40px 0; }
  .col { flex: 1; }
  h2 { font-size: 13px; margin: 12px 0 6px; color: #7b2dff; }
  table.comp { width: 100%; border-collapse: collapse; }
  table.comp td, table.comp th { padding: 4px 0; border-bottom: 1px solid #eeeef3; text-align: left; font-size: 11px; }
  table.comp th { color: #6b6b7a; font-weight: normal; font-size: 10px; }
  .r { text-align: right !important; white-space: nowrap; }
  tr.tu td { font-weight: bold; }
  ul.ch { list-style: none; padding: 0; margin: 0; columns: 1; }
  ul.ch li { padding: 2px 0; font-size: 11px; }
  .ok { color: #1f9d55; font-weight: bold; } .no { color: #d64545; font-weight: bold; } .nd { color: #8a8a9c; }
  .rec { margin: 8px 40px 0; background: #f6f2ff; border-radius: 12px; padding: 12px 16px; }
  .rec h2 { margin-top: 0; }
  .rec ol { margin: 0; padding-left: 18px; } .rec li { margin: 3px 0; }
  .regalo { margin: 10px 40px 0; border: 2px solid #7b2dff; border-radius: 12px; padding: 12px 16px; }
  .regalo b { color: #7b2dff; display: block; font-size: 12.5px; margin-bottom: 3px; }
  .cta { margin: 10px 40px 0; font-size: 12px; }
  .cta a { color: #7b2dff; font-weight: bold; text-decoration: none; }
  .pie { margin: 10px 40px 0; font-size: 8.5px; color: #8a8a9c; line-height: 1.4; }
</style></head><body>
<div class="cab">
  <div class="marca"><img src="data:image/png;base64,${logoB64}" alt=""><div><b>Judo Marketing</b><span>Build Trust, Create Value · Miami, FL</span></div></div>
  <div class="tit"><b>${t.titulo}</b><span>${t.fecha} ${d.fecha}</span></div>
</div>
<div class="neg"><div class="u">${t.preparado}</div><div class="n">${esc(d.nombre)}</div><div class="u">${esc(d.auditoria?.url ?? d.website ?? "")}${d.direccion ? " · " + esc(d.direccion) : ""}</div></div>
<div class="tiles">
  ${tile(t.velocidad, ps?.puntajes?.rendimiento ?? t.sinDatos, ps ? t.de100 : "", color(ps?.puntajes?.rendimiento))}
  ${tile(t.seo, ps?.puntajes?.seo ?? t.sinDatos, ps ? t.de100 : "", color(ps?.puntajes?.seo))}
  ${tile(t.maps, puestoMaps, puestoSub, m1?.posicion ? (m1.posicion <= 3 ? "#1f9d55" : m1.posicion <= 10 ? "#d9930d" : "#d64545") : "#d64545")}
  ${tile(t.resenas, resenas, resenasSub, d.rating != null ? (d.rating >= 4.5 ? "#1f9d55" : d.rating >= 4 ? "#d9930d" : "#d64545") : "#8a8a9c")}
</div>
<div class="cols">
  <div class="col"><h2>${t.encuentran}</h2>
    ${filasMaps || filaWeb ? `<table class="comp"><tr><th>${t.busqueda}</th><th class="r">${t.puesto}</th></tr>${filasMaps}${filaWeb}</table>` : `<div class="u">${t.sinDatos}</div>`}
    ${comp}
  </div>
  <div class="col"><h2>${t.pagina}</h2>
    ${metricas}
    <ul class="ch" style="margin-top:6px">${Object.keys(t.chequeos).map(chequeo).join("")}</ul>
  </div>
</div>
<div class="rec"><h2>${t.primero}</h2><ol>${d.recomendaciones.map((x) => `<li>${esc(x)}</li>`).join("")}</ol></div>
<div class="regalo"><b>${t.regaloTitulo}</b>${t.regalo}</div>
<div class="cta">${t.cta} <a href="https://${contacto}">${contacto}</a> · WhatsApp +1 305 934 9981</div>
<div class="pie">${t.fuente}<br>Judo Marketing · 66 W Flagler St Suite 900 PMB 11674, Miami, FL 33130 · www.judomarketing.net</div>
</body></html>`;
}

// ---------------------------------------------------------------- PDF

async function rutaChromium() {
  const candidatos = [process.env.PLAYWRIGHT_CHROMIUM, "/opt/pw-browsers/chromium"].filter(Boolean);
  for (const c of candidatos) {
    try {
      await access(c);
      return c;
    } catch {
      /* siguiente */
    }
  }
  return chromium.executablePath();
}

async function aPdf(contenido, destino) {
  const b = await chromium.launch({ executablePath: await rutaChromium() });
  try {
    const p = await b.newPage();
    await p.setContent(contenido, { waitUntil: "load" });
    await p.pdf({ path: destino, format: "Letter", printBackground: true, preferCSSPageSize: true });
    // Para revisar el diseño sin abrir el PDF: INFORME_PNG=1 deja también una imagen.
    if (process.env.INFORME_PNG) {
      await p.setViewportSize({ width: 816, height: 1056 });
      await p.screenshot({ path: destino.replace(/\.pdf$/, ".png"), fullPage: true });
    }
  } finally {
    await b.close();
  }
}

// ------------------------------------------------------------ informe

export async function informe(lead, opciones) {
  const idioma = lead.idioma === "es" ? "es" : "en";
  const t = T[idioma];
  const zonas = new Map(JSON.parse(await readFile(path.join(AQUI, "zips.json"), "utf8")).zips.map((z) => [z.zip, z.zona]));
  const zona = zonas.get(lead.zip) ?? lead.zip;
  const consulta = consultaDe(lead);

  const auditoria = lead.website ? await auditar(lead.website) : { ok: false };
  const datos = {
    nombre: lead.nombre,
    website: lead.website,
    direccion: lead.direccion ?? null,
    fecha: new Date().toLocaleDateString(idioma === "es" ? "es-US" : "en-US", { year: "numeric", month: "long", day: "numeric" }),
    auditoria: auditoria.ok ? auditoria : null,
    pagespeed: null,
    maps: [],
    web: null,
    rating: lead.rating ?? null,
    resenas: lead.resenas ?? null,
    avisos: [],
  };
  if (!auditoria.ok) datos.avisos.push(`website no respondió (${auditoria.estado || auditoria.error || "sin respuesta"})`);

  if (!opciones.sinApi) {
    if (auditoria.ok) {
      try {
        datos.pagespeed = await api("POST", "", { accion: "pagespeed", url: auditoria.url, estrategia: "mobile" });
      } catch (e) {
        datos.avisos.push(`pagespeed: ${e.message}`);
      }
    }
    const placeId = lead.place_id && !String(lead.place_id).startsWith("sunbiz:") ? lead.place_id : null;
    if (placeId) {
      for (const [q, etiqueta] of [[consulta, `${consulta} ${lead.zip}`], [`${consulta} ${zona.split("/")[0].trim()}`, `${consulta} ${zona.split("/")[0].trim()}`]]) {
        try {
          const r = await api("POST", "", { accion: "posicion", consulta: q, zip: lead.zip, place_id: placeId });
          datos.maps.push({ ...r, etiqueta });
        } catch (e) {
          datos.avisos.push(`posicion: ${e.message}`);
        }
      }
    }
    if (auditoria.ok) {
      try {
        datos.web = await api("POST", "", { accion: "posicion_web", consulta: `${consulta} ${zona.split("/")[0].trim()}`, dominio: auditoria.dominio, idioma });
      } catch (e) {
        datos.avisos.push(`posicion_web: ${e.message}`);
      }
    }
  }
  datos.recomendaciones = recomendar(t, datos);

  const logoB64 = (await readFile(path.join(RAIZ, "public", "brand", "logo-white-transparent.png"))).toString("base64");
  const slug = String(lead.nombre).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "informe";
  const archivo = path.join(opciones.salida, `${idioma === "es" ? "informe" : "report"}-${slug}.pdf`);
  await aPdf(html(t, datos, logoB64, idioma), archivo);

  const m1 = datos.maps[0];
  const fallos = Object.entries(datos.auditoria?.chequeos ?? {}).filter(([, v]) => v === false).map(([k]) => k);
  const fallosGraves = fallos.filter((k) => ["viewport", "https", "titulo", "meta_descripcion", "pedidos", "contacto"].includes(k));
  const rendimiento = datos.pagespeed?.puntajes?.rendimiento;
  const arriba = m1?.posicion != null && m1.posicion <= 3;
  // No es apto quien ya tiene plataforma integrada, o quien está arriba en
  // Maps con una página rápida y sin fallos graves: no nos necesita.
  const plataformas = (lead.senales ?? []).filter((x) => x.startsWith("ya_tiene_"));
  const apto = plataformas.length === 0 && !(arriba && (rendimiento == null || rendimiento >= 75) && fallosGraves.length === 0) && !(lead.senales ?? []).includes("muy_establecido");
  const motivo_no_apto = !apto ? (plataformas.length ? `ya usa ${plataformas[0].split(":")[1]}` : (lead.senales ?? []).includes("muy_establecido") ? "gigante de su zona" : "arriba en Maps con página rápida y sin fallos graves") : null;
  return {
    lead_id: lead.id ?? null,
    nombre: lead.nombre,
    archivo,
    idioma,
    apto,
    motivo_no_apto,
    resumen: {
      velocidad_celular: datos.pagespeed?.puntajes?.rendimiento ?? null,
      seo: datos.pagespeed?.puntajes?.seo ?? null,
      lcp: datos.pagespeed?.metricas?.lcp ?? null,
      maps: datos.maps.map((m) => ({ busqueda: m.etiqueta, puesto: m.posicion, de: m.revisados })),
      web: datos.web?.configurado ? { busqueda: datos.web.consulta, puesto: datos.web.posicion, de: datos.web.revisados } : null,
      rating: datos.rating,
      resenas: datos.resenas,
      primeros: m1?.primeros ?? [],
      dominio_desde: datos.auditoria?.dominio_desde ?? null,
      fallos,
      recomendaciones: datos.recomendaciones,
    },
    avisos: datos.avisos,
  };
}

// ---------------------------------------------------------------- main

async function main() {
  const a = args();
  if (!a.salida || (!a.leads && !a.url)) {
    console.error("Uso: node scripts/leads/informe.mjs --leads leads.json[,sunbiz.json] --ids id1,id2 --salida <carpeta>\n     node scripts/leads/informe.mjs --url https://negocio.com --nombre \"Negocio\" --zip 33131 --salida <carpeta> [--sin-api]");
    process.exit(2);
  }
  await mkdir(a.salida, { recursive: true });

  let leads = [];
  if (a.url) {
    leads = [{ id: null, nombre: a.nombre ?? new URL(a.url).hostname, website: a.url, zip: a.zip ?? "33130", idioma: a.idioma ?? "en", place_id: null, rubro: "servicios profesionales" }];
  } else {
    for (const archivo of a.leads.split(",")) {
      const j = JSON.parse(await readFile(archivo, "utf8"));
      for (const lista of ["candidatos_para_escribir", "para_llamar_o_whatsapp", "con_google_sin_website"]) for (const l of j[lista] ?? []) leads.push(l);
    }
    if (a.ids.length) leads = leads.filter((l) => a.ids.includes(l.id));
    leads = leads.filter((l) => l.website);
  }
  if (leads.length === 0) throw new Error("No hay leads con website para informar");

  const resultados = [];
  for (const [i, lead] of leads.entries()) {
    process.stderr.write(`${i + 1}/${leads.length} ${lead.nombre}... `);
    try {
      const r = await informe(lead, a);
      resultados.push(r);
      process.stderr.write(`${path.basename(r.archivo)}${r.avisos.length ? " (avisos: " + r.avisos.join("; ") + ")" : ""}\n`);
    } catch (e) {
      resultados.push({ lead_id: lead.id ?? null, nombre: lead.nombre, error: e.message });
      process.stderr.write(`ERROR ${e.message}\n`);
    }
  }
  const indice = path.join(a.salida, "informes.json");
  await writeFile(indice, JSON.stringify(resultados, null, 2));
  console.error(`Listo: ${resultados.filter((r) => r.archivo).length} informes en ${a.salida}; índice en ${indice}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error("Error:", e.message);
    process.exit(1);
  });
}
