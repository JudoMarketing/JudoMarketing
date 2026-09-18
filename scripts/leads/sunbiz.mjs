#!/usr/bin/env node
/**
 * Sunbiz: los negocios que Google todavía no conoce.
 *
 * La División de Corporaciones de Florida publica cada día hábil un archivo
 * con todas las empresas registradas ese día (y los guarda desde 2022). Con
 * usuario público, que el propio Estado publica en su página de descargas.
 * Este script:
 *
 *   1. Baja los archivos diarios que no se han procesado: los más nuevos
 *      (negocios recién abiertos) y los de hace 2 y 3 años (negocios con
 *      tiempo operando).
 *   2. Se queda con los de nuestra zona (scripts/leads/zips.json) cuyo nombre
 *      dice a qué se dedican (restaurante, taller, salón, limpieza...).
 *   3. Pregunta a Google, por nombre, si el negocio existe ahí: si tiene
 *      website se estudia como cualquier otro; si tiene perfil sin website
 *      queda con teléfono; si no existe en Google, queda "sin presencia" con
 *      el nombre de quien lo registró y su dirección postal.
 *   4. Guarda todo en la base a través del sitio y deja un JSON para la
 *      sesión.
 *
 *   node scripts/leads/sunbiz.mjs --salida /ruta/sunbiz.json [--nuevos 3] [--historicos 2,3] [--max 200]
 *   node scripts/leads/sunbiz.mjs --sin-api --nuevos 1     (prueba: solo baja, filtra y muestra)
 *
 * Entorno: LEADS_SECRET (obligatorio salvo --sin-api), LEADS_SITE (opcional).
 * SUNBIZ_USER / SUNBIZ_PASS solo si el Estado cambia el usuario público.
 */

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { api, enLotes, estudiarSitio, puntuar } from "./buscar.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const PORTAL = "https://sftp.floridados.gov";
// Usuario público publicado por el Estado en
// https://dos.fl.gov/sunbiz/other-services/data-downloads/
const USUARIO = process.env.SUNBIZ_USER ?? "Public";
const CLAVE = process.env.SUNBIZ_PASS ?? "PubAccess1845!";
// El portal está detrás de Cloudflare: sin cabeceras de navegador contesta 403.
const CABECERAS = {
  Authorization: "Basic " + Buffer.from(`${USUARIO}:${CLAVE}`).toString("base64"),
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  Accept: "*/*",
};

// ------------------------------------------------------------ argumentos

function args() {
  const a = process.argv.slice(2);
  const leer = (k, d) => {
    const i = a.indexOf(k);
    return i >= 0 ? a[i + 1] : d;
  };
  return {
    salida: leer("--salida"),
    nuevos: Number(leer("--nuevos", 3)),
    historicos: String(leer("--historicos", "2,3")).split(",").map(Number).filter(Boolean),
    maximo: Number(leer("--max", 200)),
    sinApi: a.includes("--sin-api"),
  };
}

// ------------------------------------------------------------- portal

async function portal(ruta) {
  const res = await fetch(`${PORTAL}${ruta}`, { headers: CABECERAS });
  if (!res.ok) throw new Error(`Sunbiz ${ruta} → ${res.status}${res.status === 403 ? " (Cloudflare rechazó la petición)" : ""}`);
  return res;
}

async function listarArchivos() {
  const xml = await (await portal(`/Public/doc/cor?request=data&_=${Date.now()}`)).text();
  return [...new Set(xml.match(/\d{8}c\.txt/g) ?? [])].sort();
}

async function bajarArchivo(nombre) {
  const buf = Buffer.from(await (await portal(`/Public/doc/cor/${nombre}`)).arrayBuffer());
  return buf.toString("latin1");
}

/** El archivo más cercano en o antes de una fecha (los fines de semana no hay archivo). */
function archivoHasta(archivos, fecha) {
  const objetivo = fecha.toISOString().slice(0, 10).replace(/-/g, "") + "c.txt";
  return archivos.filter((a) => a <= objetivo).at(-1) ?? null;
}

// ------------------------------------------------------------- registros

// Definición oficial: https://dos.sunbiz.org/data-definitions/cor.html
const campo = (l, ini, len) => l.substring(ini - 1, ini - 1 + len).trim();
const limpiar = (t) => t.replace(/\s+/g, " ").trim();
const titulo = (t) => limpiar(t).toLowerCase().replace(/(^|[\s'-])([a-záéíóúñ])/g, (m, a, b) => a + b.toUpperCase());

function parsear(texto) {
  return texto
    .split(/\r?\n/)
    .filter((l) => l.length >= 1400)
    .map((l) => {
      const of = (n) => {
        const base = 669 + (n - 1) * 128;
        return { titulo: campo(l, base, 4), tipo: campo(l, base + 4, 1), nombre: limpiar(campo(l, base + 5, 42)) };
      };
      const oficiales = [1, 2, 3].map(of).filter((o) => o.nombre && o.tipo === "P");
      const fecha = campo(l, 473, 8); // MMDDYYYY
      return {
        numero: campo(l, 1, 12),
        nombre: limpiar(campo(l, 13, 192)),
        estado: campo(l, 205, 1),
        tipo: campo(l, 206, 15),
        direccion: limpiar(`${campo(l, 221, 42)} ${campo(l, 263, 42)}`),
        ciudad: titulo(campo(l, 305, 28)),
        st: campo(l, 333, 2),
        zip: campo(l, 335, 10).slice(0, 5),
        postal: limpiar(`${campo(l, 347, 42)} ${campo(l, 389, 42)}, ${titulo(campo(l, 431, 28))}, ${campo(l, 459, 2)} ${campo(l, 461, 10).slice(0, 5)}`),
        fecha: /^\d{8}$/.test(fecha) ? `${fecha.slice(4)}-${fecha.slice(0, 2)}-${fecha.slice(2, 4)}` : null,
        agente: limpiar(campo(l, 545, 42)),
        agenteTipo: campo(l, 587, 1),
        oficiales,
      };
    });
}

// Qué hace el negocio, leído de su nombre. El orden importa: gana el primero.
const RUBROS = [
  ["restaurante", /\b(RESTAURANT|CAFE|CAFETERIA|PIZZA|BAKERY|PANADERIA|GRILL|KITCHEN|CATERING|FOOD|TACOS|SUSHI|COFFEE|JUICE|SMOOTHIE|ICE CREAM|DESSERT|BBQ|CHICKEN|BURGER|EMPANADA|AREPA|CEVICHE|SEAFOOD|MEAT MARKET)\b/],
  ["salon o estetica", /\b(SALON|BEAUTY|NAILS?|BARBER|LASHES|BROWS|SPA|WELLNESS|MASSAGE|SKIN|COSMETIC|AESTHETIC|HAIR|MAKEUP|WAXING)\b/],
  ["limpieza o mantenimiento", /\b(CLEANING|JANITORIAL|MAID|LANDSCAP|LAWN|GARDEN|POOL|PEST|PRESSURE|HANDYMAN|LAUNDRY|DRY CLEAN)\b/],
  ["contratista o construccion", /\b(PLUMBING|ELECTRIC|ELECTRICAL|HVAC|AIR CONDITIONING|COOLING|ROOFING|CONSTRUCTION|CONTRACTOR|REMODEL|PAINTING|WATERPROOFING|FLOORING|CABINET|GLASS|WINDOWS|DOORS|DRYWALL|TILE|MARBLE|SOLAR|FENCE|CONCRETE|IRRIGATION|APPLIANCE)\b/],
  ["taller o automotriz", /\b(AUTO|MOTORS?|REPAIR|TIRES?|BODY SHOP|TOWING|DETAILING|CAR WASH|MECHANIC|COLLISION|TRANSMISSION)\b/],
  ["clinica o salud", /\b(DENTAL|CLINIC|MEDICAL|HEALTH|THERAPY|CHIROPRACTIC|PHARMACY|OPTICAL|HOME CARE|HOMECARE|NURSING|PEDIATRIC|PHYSICAL THERAPY|REHAB|COUNSELING|PSYCHOLOGY)\b/],
  ["gimnasio o academia", /\b(FITNESS|GYM|YOGA|PILATES|MARTIAL|BOXING|CROSSFIT|DANCE|MUSIC|ACADEMY|LEARNING|TUTORING|SCHOOL|DAYCARE|PRESCHOOL|EDUCATION)\b/],
  ["transporte o logistica", /\b(MOVING|MOVERS|TRANSPORT|LOGISTICS|TRUCKING|DELIVERY|COURIER|FREIGHT|SHIPPING|CARGO|TOURS?|TRAVEL|LIMO|CHARTER)\b/],
  ["tienda o comercio", /\b(BOUTIQUE|SHOP|STORE|MARKET|JEWELRY|FASHION|CLOTHING|APPAREL|SMOKE|VAPE|CIGAR|LIQUOR|GROCERY|FURNITURE|MATTRESS|FLOWERS|FLORIST|CANDLES|PHONE|CELLULAR|COMPUTER|GIFTS?|PARTY|DECOR)\b/],
  ["mayorista o distribucion", /\b(SUPPLY|SUPPLIES|DISTRIBUT\w*|WHOLESALE|TRADING|IMPORT|EXPORT|WAREHOUSE|PRODUCTS)\b/],
  ["servicios profesionales", /\b(CONSULTING|ACCOUNTING|BOOKKEEPING|TAX|INSURANCE|LAW|LEGAL|NOTARY|STAFFING|MARKETING|DESIGN|PHOTOGRAPHY|VIDEO|STUDIO|PRINTING|SIGNS|EVENTS?|SECURITY|PET|GROOMING|VETERINARY|TATTOO|MARINE|BOAT|YACHT|AVIATION|TECH|SOLUTION)\b/],
];

const FUERA =
  /\b(HOLDINGS?|INVESTMENTS?|INVESTORS|PROPERTIES|PROPERTY|REALTY|REAL ESTATE|CAPITAL|VENTURES?|TRUST|ASSETS?|EQUITY|EQUITIES|PARTNERS|FUND|ACQUISITIONS?|DEVELOPMENT|LAND|HOMES|RENTALS?|LEASING|CONDO|ESTATES?|FOUNDATION|MINISTR(Y|IES)|CHURCH|IGLESIA|ASSOCIATION|HOA|OWNERS)\b/;

function rubroDe(nombre) {
  const n = nombre.toUpperCase();
  if (FUERA.test(n)) return null;
  for (const [rubro, re] of RUBROS) if (re.test(n)) return rubro;
  return null;
}

// ---------------------------------------------------------------- main

async function main() {
  const a = args();
  if (!a.sinApi && !a.salida) {
    console.error("Uso: node scripts/leads/sunbiz.mjs --salida /ruta/sunbiz.json [--nuevos 3] [--historicos 2,3] [--max 200] [--sin-api]");
    process.exit(2);
  }
  const zips = new Map(JSON.parse(await readFile(path.join(AQUI, "zips.json"), "utf8")).zips.map((z) => [z.zip, z.zona]));

  console.error("Sunbiz: listando archivos diarios...");
  const archivos = await listarArchivos();
  if (archivos.length === 0) throw new Error("El portal no devolvió archivos; ¿cambió el usuario público?");
  const procesados = new Set(a.sinApi ? [] : ((await api("GET", "?archivos=1")).archivos ?? []).map((x) => x.archivo));

  // Los más nuevos sin procesar, y uno por cada año hacia atrás.
  const elegidos = [];
  for (const f of [...archivos].reverse()) {
    if (elegidos.length >= a.nuevos) break;
    if (!procesados.has(f)) elegidos.push({ archivo: f, clase: "nuevo" });
  }
  for (const anos of a.historicos) {
    const fecha = new Date();
    fecha.setUTCFullYear(fecha.getUTCFullYear() - anos);
    const f = archivoHasta(archivos, fecha);
    if (f && !procesados.has(f) && !elegidos.some((e) => e.archivo === f)) elegidos.push({ archivo: f, clase: `hace ${anos} años` });
  }
  if (elegidos.length === 0) {
    console.error("No hay archivos nuevos que procesar.");
    if (a.salida) await writeFile(a.salida, JSON.stringify({ archivos: [], candidatos_para_escribir: [], con_google_sin_website: [], sin_presencia: [] }, null, 2));
    return;
  }
  console.error("Archivos:", elegidos.map((e) => `${e.archivo} (${e.clase})`).join(", "));

  // Bajar, parsear y filtrar.
  const candidatos = [];
  const resumenArchivos = [];
  for (const e of elegidos) {
    const registros = parsear(await bajarArchivo(e.archivo));
    const enZona = registros.filter((r) => zips.has(r.zip) && r.estado === "A" && ["FLAL", "DOMP"].includes(r.tipo));
    const conRubro = enZona.map((r) => ({ ...r, rubro: rubroDe(r.nombre), clase: e.clase, archivo: e.archivo })).filter((r) => r.rubro);
    resumenArchivos.push({ archivo: e.archivo, clase: e.clase, registros: registros.length, en_zona: enZona.length, candidatos: conRubro.length });
    console.error(`  ${e.archivo}: ${registros.length} registros, ${enZona.length} en zona, ${conRubro.length} con rubro`);
    candidatos.push(...conRubro);
  }

  if (a.sinApi) {
    for (const c of candidatos.slice(0, 40)) {
      console.log(`${c.zip} ${c.clase.padEnd(12)} ${c.rubro.padEnd(26)} ${c.nombre.slice(0, 46).padEnd(46)} ${c.ciudad.padEnd(16)} ${c.oficiales[0]?.nombre ?? "(sin oficial)"}`);
    }
    console.log(`\n${candidatos.length} candidatos en total (mostrados 40).`);
    return;
  }

  // Google, por nombre. Tope para no gastar de más en Places. Primero los que
  // llevan años (son los que más probablemente existen en Google y facturan
  // sin sistema); los recién registrados, después.
  const ordenados = [...candidatos.filter((c) => c.clase !== "nuevo"), ...candidatos.filter((c) => c.clase === "nuevo")];
  const aRevisar = ordenados.slice(0, a.maximo);
  console.error(`Preguntando a Google por ${aRevisar.length} negocios...`);
  const revisados = await enLotes(aRevisar, 4, async (c, k) => {
    let google = null;
    try {
      google = await api("POST", "", { accion: "buscar_nombre", nombre: c.nombre, ciudad: c.ciudad, zip: c.zip });
    } catch (err) {
      google = { en_google: false, error: err.message };
    }
    let estudio = { email: null, idioma: null, constructor: null, senales: [], resumen: null, urlFinal: null };
    if (google?.en_google && google.detalle?.website) estudio = await estudiarSitio(google.detalle.website, google.detalle.tipo_google ?? "");
    else if (google?.en_google) estudio.senales.push("sin_website");
    else if (google?.error) estudio.senales.push("google_no_verificado");
    else estudio.senales.push("sin_presencia_en_google");
    process.stderr.write(`  ${k + 1}/${aRevisar.length} ${c.nombre.slice(0, 40)} → ${google?.en_google ? (google.detalle?.website ? "website" : "google sin website") : google?.error ? "no verificado (" + google.error.slice(0, 60) + ")" : "sin presencia"}${estudio.email ? " ✓ " + estudio.email : ""}\n`);
    return { c, google, estudio };
  });

  const filas = revisados.map(({ c, google, estudio }) => {
    const d = google?.en_google ? google.detalle ?? {} : {};
    const base = { resenas: d.resenas ?? null, rating: d.rating ?? null };
    return {
      place_id: google?.en_google ? google.place_id : `sunbiz:${c.numero}`,
      nombre: google?.en_google ? google.nombre : titulo(c.nombre),
      zip: c.zip,
      direccion: google?.en_google ? google.direccion : `${titulo(c.direccion)}, ${c.ciudad}, FL ${c.zip}`,
      telefono: d.telefono ?? null,
      website: estudio.urlFinal ?? d.website ?? null,
      email: estudio.email,
      tipo_google: d.tipo_google ?? null,
      rubro: c.rubro,
      rating: base.rating,
      resenas: base.resenas,
      idioma: estudio.idioma,
      constructor: estudio.constructor,
      senales: [...estudio.senales, c.clase === "nuevo" ? "registrado_hace_dias" : `registrado_${c.clase.replace(/\s+/g, "_")}`],
      resumen_sitio: estudio.resumen ?? `Registrado en Sunbiz el ${c.fecha} como ${c.tipo === "FLAL" ? "LLC" : "corporación"}. Al frente: ${c.oficiales.map((o) => `${titulo(o.nombre)} (${o.titulo})`).join(", ") || "no consta"}. Agente registrado: ${titulo(c.agente)}.`,
      puntaje: puntuar(base, estudio) + (google?.en_google ? 0 : 2),
      fuente: "sunbiz",
      sunbiz_numero: c.numero,
      sunbiz_fecha: c.fecha,
      oficial: c.oficiales[0] ? titulo(c.oficiales[0].nombre) : null,
      direccion_postal: c.postal,
      maps: d.maps ?? null,
      clase: c.clase,
    };
  });

  const guardados = [];
  for (let i = 0; i < filas.length; i += 100) {
    const { leads } = await api("POST", "", { accion: "guardar", leads: filas.slice(i, i + 100).map(({ maps, clase, ...f }) => f) });
    guardados.push(...leads);
  }
  const porPlace = new Map(guardados.map((g) => [g.place_id, g]));
  const leads = filas.map((f) => ({ id: porPlace.get(f.place_id)?.id ?? null, estado: porPlace.get(f.place_id)?.estado ?? null, ...f })).sort((x, y) => y.puntaje - x.puntaje);

  for (const r of resumenArchivos) await api("POST", "", { accion: "archivo", archivo: r.archivo, registros: r.registros, en_zona: r.en_zona, candidatos: r.candidatos });

  const salida = {
    fecha: new Date().toISOString(),
    archivos: resumenArchivos,
    revisados: filas.length,
    no_revisados_por_tope: Math.max(0, candidatos.length - aRevisar.length),
    candidatos_para_escribir: leads.filter((l) => l.email && l.estado === "nuevo"),
    con_google_sin_website: leads.filter((l) => !l.email && l.telefono),
    sin_presencia: leads.filter((l) => !l.email && !l.telefono && !l.senales.includes("google_no_verificado")),
    // No se pudo preguntar a Google (error de red o del sitio): no se sabe si existen.
    sin_verificar: leads.filter((l) => l.senales.includes("google_no_verificado")),
  };
  await writeFile(a.salida, JSON.stringify(salida, null, 2));
  console.error(
    `Listo. ${filas.length} revisados: ${salida.candidatos_para_escribir.length} con correo, ${salida.con_google_sin_website.length} en Google sin website (teléfono), ${salida.sin_presencia.length} sin presencia en línea, ${salida.sin_verificar.length} sin verificar. Guardado en ${a.salida}`
  );
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
