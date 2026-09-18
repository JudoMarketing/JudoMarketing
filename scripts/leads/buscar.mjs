#!/usr/bin/env node
/**
 * Investigación de un código postal: pide los negocios al sitio (que los
 * saca de Google Places), visita el website de cada uno, encuentra su
 * correo y las señales de que le falta algo, y guarda todo en la base a
 * través del sitio. Deja un JSON con lo que la sesión necesita para elegir
 * a quién escribirle.
 *
 *   node scripts/leads/buscar.mjs --zip 33130 --salida /ruta/leads.json
 *   node scripts/leads/buscar.mjs --zip auto  --salida /ruta/leads.json
 *   node scripts/leads/buscar.mjs --solo-sitio https://ejemplo.com   (depuración)
 *
 * Entorno: LEADS_SECRET (obligatorio), LEADS_SITE (opcional, por defecto
 * https://www.judomarketing.net).
 *
 * Solo usa fetch de Node 22. Sin dependencias.
 */

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SITE = (process.env.LEADS_SITE ?? "https://www.judomarketing.net").replace(/\/$/, "");
const SECRETO = process.env.LEADS_SECRET;
const UA = "Mozilla/5.0 (compatible; JudoMarketing/1.0; +https://www.judomarketing.net)";
const TIEMPO_PAGINA_MS = 9000;
const CONCURRENCIA = 6;
const DIAS_ROTACION = 60;

// ------------------------------------------------------------ argumentos

function args() {
  const a = process.argv.slice(2);
  const leer = (k) => {
    const i = a.indexOf(k);
    return i >= 0 ? a[i + 1] : undefined;
  };
  return {
    zip: leer("--zip"),
    salida: leer("--salida"),
    maximo: Number(leer("--max") ?? 100),
    soloSitio: leer("--solo-sitio"),
  };
}

// ----------------------------------------------------------------- API

export async function api(metodo, ruta, cuerpo) {
  if (!SECRETO) throw new Error("Falta LEADS_SECRET en el entorno");
  const res = await fetch(`${SITE}/api/leads${ruta}`, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${SECRETO}`,
      "Content-Type": "application/json",
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${metodo} /api/leads${ruta} → ${res.status}: ${datos.error ?? "sin detalle"}`);
  return datos;
}

/** El primer zip de la rotación que no se corrió en los últimos 60 días. */
async function siguienteZip() {
  const lista = JSON.parse(await readFile(path.join(AQUI, "zips.json"), "utf8")).zips;
  const { corridas } = await api("GET", "?corridas=1");
  const limite = Date.now() - DIAS_ROTACION * 86_400_000;
  const recientes = new Set(
    corridas.filter((c) => new Date(c.creado_en).getTime() > limite).map((c) => c.zip)
  );
  const libre = lista.find((z) => !recientes.has(z.zip));
  if (libre) return libre;
  // Todos corridos hace poco: el que lleva más tiempo sin tocarse.
  const ultima = new Map();
  for (const c of corridas) if (!ultima.has(c.zip)) ultima.set(c.zip, c.creado_en);
  return [...lista].sort((a, b) => new Date(ultima.get(a.zip) ?? 0) - new Date(ultima.get(b.zip) ?? 0))[0];
}

// ------------------------------------------------------------- scraping

const CORREOS_BASURA =
  /(noreply|no-reply|donotreply|do-not-reply|postmaster|abuse|bugreport|bug@|mailer-daemon|privacy|unsubscribe|example\.|sentry|wixpress|wix\.com|godaddy|squarespace|wordpress|w3\.org|schema\.org|yourdomain|yourname|domain\.com|email\.com$|@sentry|@2x|moatable|placester|realgeeks|kvcore|\.(png|jpg|jpeg|gif|svg|webp)$|^[0-9a-f]{20,}@|[{}\\|<>])/i;

// Correos de la agencia que hizo la página, no del negocio: si el dominio no
// es el del sitio y suena a agencia, no sirve para escribirle al dueño.
const DOMINIO_AGENCIA = /(creative|agency|agencia|media|design|studio|marketing|digital|webdev|seo|hosting|develop)/i;

const CONSTRUCTORES = [
  ["wix", /wixstatic\.com|wix\.com|_wixCIDX|wixsite/i],
  ["squarespace", /squarespace\.com|static1\.squarespace|sqs-/i],
  ["godaddy", /godaddysites|godaddy\.com|wsimg\.com|img1\.wsimg/i],
  ["weebly", /weebly\.com|editmysite/i],
  ["shopify", /cdn\.shopify\.com|myshopify/i],
  ["wordpress", /wp-content|wp-includes/i],
  ["webflow", /webflow\.com|webflow\.io/i],
  ["jimdo", /jimdo/i],
  ["site123", /site123/i],
  ["strikingly", /strikingly/i],
  ["google-sites", /sites\.google\.com/i],
  ["linktree", /linktr\.ee/i],
];

const SOCIALES = /^(https?:\/\/)?(www\.)?(facebook|instagram|linktr\.ee|tiktok|yelp|m\.facebook|business\.site|google\.com\/maps)/i;

export function textoVisible(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, "&")
    .replace(/&apos;|&rsquo;|&lsquo;/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function meta(html, nombre) {
  const m =
    html.match(new RegExp(`<meta[^>]+name=["']${nombre}["'][^>]+content=["']([^"']*)["']`, "i")) ||
    html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${nombre}["']`, "i"));
  return m ? m[1].trim() : "";
}

export async function traer(url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIEMPO_PAGINA_MS);
  try {
    const res = await fetch(url, {
      signal: ctl.signal,
      redirect: "follow",
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
    });
    const tipo = res.headers.get("content-type") ?? "";
    if (!tipo.includes("html")) return { ok: false, estado: res.status, url: res.url, html: "" };
    const html = (await res.text()).slice(0, 1_500_000);
    return { ok: res.ok, estado: res.status, url: res.url, html };
  } catch (e) {
    return { ok: false, estado: 0, url, html: "", error: e.name === "AbortError" ? "timeout" : e.message };
  } finally {
    clearTimeout(t);
  }
}

function extraerCorreos(html, dominio) {
  const encontrados = new Set();
  for (const m of html.matchAll(/mailto:([^"'?\s<>]+)/gi)) encontrados.add(decodeURIComponent(m[1]).toLowerCase());
  for (const m of html.matchAll(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi)) encontrados.add(m[0].toLowerCase());
  const limpios = [...encontrados].filter((e) => {
    if (CORREOS_BASURA.test(e) || e.length > 80) return false;
    const dom = e.split("@")[1] ?? "";
    if (dominio && dom !== dominio && !dom.endsWith("." + dominio) && DOMINIO_AGENCIA.test(dom)) return false;
    return true;
  });
  const puntaje = (e) => {
    let p = 0;
    if (dominio && e.endsWith("@" + dominio)) p += 5;
    if (/^(info|contact|contacto|hello|hola|ventas|sales|office|admin|reservations|reservas|orders|pedidos)@/.test(e)) p += 2;
    if (/@(gmail|yahoo|hotmail|outlook|icloud|aol)\./.test(e)) p += 1;
    return p;
  };
  return limpios.sort((a, b) => puntaje(b) - puntaje(a));
}

function detectarIdioma(html, texto) {
  const lang = (html.match(/<html[^>]+lang=["']([a-z]{2})/i) || [])[1];
  if (lang === "es") return "es";
  if (lang === "en") return "en";
  const t = " " + texto.toLowerCase().slice(0, 4000) + " ";
  const es = (t.match(/ (nosotros|servicios|contacto|nuestros|más|también|horario|precios|cita|pedido|somos) /g) || []).length;
  const en = (t.match(/ (about|services|contact|our|more|also|hours|prices|appointment|order|we are) /g) || []).length;
  return es > en ? "es" : "en";
}

function enlacesInternos(html, base) {
  const salida = [];
  for (const m of html.matchAll(/href=["']([^"'#]+)["']/gi)) {
    let u;
    try {
      u = new URL(m[1], base);
    } catch {
      continue;
    }
    if (u.host !== new URL(base).host) continue;
    if (/contact|contacto|about|nosotros|sobre|quienes|reserv|book|order|pedido|menu/i.test(u.pathname)) salida.push(u.href);
  }
  return [...new Set(salida)].slice(0, 4);
}

/** Visita el website de un negocio y devuelve lo que se puede saber desde fuera. */
export async function estudiarSitio(website, tipoGoogle = "") {
  const r = { email: null, idioma: null, constructor: null, senales: [], resumen: null, urlFinal: website };
  if (!website) {
    r.senales.push("sin_website");
    return r;
  }
  if (SOCIALES.test(website)) {
    r.senales.push("website_es_red_social");
    r.constructor = "red-social";
    return r;
  }
  const inicio = await traer(website);
  r.urlFinal = inicio.url;
  if (!inicio.ok || !inicio.html) {
    r.senales.push(inicio.estado ? `website_responde_${inicio.estado}` : `website_caido_${inicio.error ?? "sin_respuesta"}`);
    return r;
  }
  let html = inicio.html;
  const dominio = new URL(inicio.url).hostname.replace(/^www\./, "");
  let correos = extraerCorreos(html, dominio);
  const texto = textoVisible(html);

  if (correos.length === 0) {
    // Primero los enlaces que el sitio ofrece; si no hay, las rutas típicas.
    const origen = new URL(inicio.url).origin;
    const rutas = enlacesInternos(html, inicio.url);
    for (const r of ["/contact", "/contact-us", "/contacto", "/about", "/about-us", "/nosotros"]) {
      if (rutas.length >= 6) break;
      if (!rutas.includes(origen + r)) rutas.push(origen + r);
    }
    for (const enlace of rutas) {
      const pag = await traer(enlace);
      if (!pag.ok) continue;
      html += "\n" + pag.html;
      correos = extraerCorreos(pag.html, dominio);
      if (correos.length) break;
    }
  }
  r.email = correos[0] ?? null;
  r.idioma = detectarIdioma(inicio.html, texto);
  for (const [nombre, re] of CONSTRUCTORES) {
    if (re.test(inicio.html)) {
      r.constructor = nombre;
      break;
    }
  }

  if (inicio.url.startsWith("http://")) r.senales.push("sin_https");
  if (!/<meta[^>]+viewport/i.test(inicio.html)) r.senales.push("no_se_adapta_a_celular");
  if (["wix", "godaddy", "weebly", "site123", "strikingly", "google-sites", "jimdo"].includes(r.constructor)) r.senales.push("constructor_basico");
  const anios = [...inicio.html.matchAll(/(?:©|&copy;|copyright)[^0-9]{0,20}(20[0-9]{2})/gi)].map((m) => Number(m[1]));
  const anio = anios.length ? Math.max(...anios) : null;
  if (anio && anio < new Date().getFullYear() - 1) r.senales.push(`copyright_${anio}`);
  const titulo = textoVisible((inicio.html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] ?? "");
  if (!titulo || /^(home|inicio|index|welcome|untitled|new page|website)$/i.test(titulo)) r.senales.push("titulo_generico");
  if (texto.length < 400) r.senales.push("casi_sin_contenido");
  if (/(site|website|page|sitio|página) (is )?(under construction|coming soon|en construcci[oó]n)|under construction/i.test(texto)) r.senales.push("en_construccion");

  const t = (tipoGoogle + " " + texto.slice(0, 6000)).toLowerCase();
  const esComida = /restaurant|cafe|bakery|pizza|bar|food|comida|cafeter/i.test(tipoGoogle);
  const esServicio = /repair|salon|barber|dentist|dental|clinic|doctor|spa|gym|lawyer|accountant|cleaning|plumber|electrician|contractor|therapy|physio|veterinar|groom|tutor|daycare|moving|landscap|insurance|real_estate|car_wash|photograph|beauty|nail|massage/i.test(tipoGoogle);
  const esTienda = /store|shop|boutique|furniture|clothing|jewelry|florist|market|wholesale|distributor|supply|warehouse|dealer/i.test(tipoGoogle);
  if (esComida && !/order online|pedir en l|pedido en l|ordena|reserv|book a table|doordash|ubereats|grubhub|toast|menu/i.test(t)) r.senales.push("comida_sin_pedidos_ni_reservas_en_linea");
  if (esServicio && !/book|appointment|agenda|cita|schedule|reservar|calendly|square|vagaro|booksy|zocdoc/i.test(t)) r.senales.push("servicio_sin_citas_en_linea");
  if (esTienda && !/cart|carrito|checkout|comprar|add to|shop now|tienda en l|catalog|cat[aá]logo/i.test(t)) r.senales.push("tienda_sin_venta_en_linea");
  if (!/whatsapp|wa\.me/i.test(inicio.html)) r.senales.push("sin_whatsapp");

  const descripcion = meta(inicio.html, "description");
  const h1 = textoVisible((inicio.html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] ?? "");
  r.resumen = [titulo && `Título: ${titulo}`, descripcion && `Descripción: ${descripcion}`, h1 && `Encabezado: ${h1}`, `Texto: ${texto.slice(0, 600)}`]
    .filter(Boolean)
    .join(" | ")
    .slice(0, 1200);
  return r;
}

export function puntuar(c, estudio) {
  let p = 0;
  const s = new Set(estudio.senales);
  if (s.has("sin_website")) p += 4;
  if (s.has("website_es_red_social")) p += 4;
  if ([...s].some((x) => x.startsWith("website_caido") || x.startsWith("website_responde"))) p += 4;
  if (s.has("en_construccion")) p += 3;
  if (s.has("constructor_basico")) p += 2;
  if (s.has("sin_https")) p += 2;
  if (s.has("no_se_adapta_a_celular")) p += 2;
  if ([...s].some((x) => x.startsWith("copyright_"))) p += 1;
  if (s.has("titulo_generico")) p += 1;
  if (s.has("casi_sin_contenido")) p += 2;
  if (s.has("comida_sin_pedidos_ni_reservas_en_linea")) p += 3;
  if (s.has("servicio_sin_citas_en_linea")) p += 3;
  if (s.has("tienda_sin_venta_en_linea")) p += 3;
  if (s.has("sin_whatsapp")) p += 1;
  if (c.resenas != null && c.resenas >= 20 && c.resenas <= 400) p += 1; // negocio real, todavía chico
  if (c.rating != null && c.rating >= 4.2) p += 1; // buen negocio con mala presencia: el mejor cliente
  // Un negocio con miles de reseñas ya tiene quien le resuelva todo: no es
  // nuestro cliente aunque a su página le falte algo.
  if (c.resenas != null && c.resenas > 800) {
    p -= 3;
    estudio.senales.push("muy_establecido");
  }
  return p;
}

export async function enLotes(items, n, fn) {
  const salida = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const k = i++;
        salida[k] = await fn(items[k], k);
      }
    })
  );
  return salida;
}

// ---------------------------------------------------------------- main

async function main() {
  const a = args();

  if (a.soloSitio) {
    console.log(JSON.stringify(await estudiarSitio(a.soloSitio), null, 2));
    return;
  }
  if (!a.zip || !a.salida) {
    console.error("Uso: node scripts/leads/buscar.mjs --zip 33130|auto --salida /ruta/leads.json [--max 100]");
    process.exit(2);
  }

  let zona = null;
  let zip = a.zip;
  if (zip === "auto") {
    const z = await siguienteZip();
    zip = z.zip;
    zona = z.zona;
  }
  console.error(`Zip ${zip}${zona ? ` (${zona})` : ""}: pidiendo negocios a Google Places...`);

  const semilla = Number(zip.slice(-2));
  const { candidatos, consultas, aviso } = await api("POST", "", { accion: "buscar", zip, maximo: a.maximo, semilla });
  if (aviso) console.error("Aviso de Places:", aviso);
  console.error(`${candidatos.length} negocios en ${consultas} consultas. Visitando websites...`);

  // Los que ya se escribieron o están de baja no se vuelven a estudiar.
  const aEstudiar = candidatos.filter(
    (c) => !c.conocido || ["nuevo", "sin_correo"].includes(c.conocido.estado)
  );
  const estudiados = await enLotes(aEstudiar, CONCURRENCIA, async (c, k) => {
    const e = await estudiarSitio(c.website, c.tipo_google ?? "");
    process.stderr.write(`  ${k + 1}/${aEstudiar.length} ${c.nombre}${e.email ? " ✓ " + e.email : ""}\n`);
    return { c, e };
  });

  const filas = estudiados.map(({ c, e }) => ({
    place_id: c.place_id,
    nombre: c.nombre,
    zip,
    direccion: c.direccion,
    telefono: c.telefono,
    website: e.urlFinal ?? c.website,
    email: e.email,
    tipo_google: c.tipo_google,
    rating: c.rating,
    resenas: c.resenas,
    idioma: e.idioma,
    constructor: e.constructor,
    senales: e.senales,
    resumen_sitio: e.resumen,
    puntaje: puntuar(c, e),
  }));

  const guardados = [];
  for (let i = 0; i < filas.length; i += 100) {
    const { leads } = await api("POST", "", { accion: "guardar", leads: filas.slice(i, i + 100) });
    guardados.push(...leads);
  }
  const porPlace = new Map(guardados.map((g) => [g.place_id, g]));

  const leads = filas
    .map((f) => {
      const g = porPlace.get(f.place_id);
      return { id: g?.id ?? null, estado: g?.estado ?? null, ...f, maps: candidatos.find((c) => c.place_id === f.place_id)?.maps ?? null };
    })
    .sort((x, y) => y.puntaje - x.puntaje);

  const conCorreo = leads.filter((l) => l.email && l.estado === "nuevo");
  const sinCorreo = leads.filter((l) => !l.email);
  const yaConocidos = candidatos.length - aEstudiar.length;

  const salida = {
    zip,
    zona,
    fecha: new Date().toISOString(),
    encontrados: candidatos.length,
    ya_conocidos: yaConocidos,
    con_correo: conCorreo.length,
    sin_correo: sinCorreo.length,
    candidatos_para_escribir: conCorreo,
    para_llamar_o_whatsapp: sinCorreo.filter((l) => l.telefono).slice(0, 25),
  };
  await writeFile(a.salida, JSON.stringify(salida, null, 2));
  console.error(
    `Listo. ${candidatos.length} encontrados (${yaConocidos} ya conocidos), ${conCorreo.length} con correo para escribir, ${sinCorreo.length} sin correo. Guardado en ${a.salida}`
  );
}

// Solo corre cuando se ejecuta directo; sunbiz.mjs importa estudiarSitio de aquí.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error("Error:", e.message);
    process.exit(1);
  });
}
