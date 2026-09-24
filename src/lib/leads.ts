/**
 * Prospección por correo: la parte que vive en el servidor.
 *
 * La sesión automática (ver docs/LEADS.md) no tiene acceso a la base ni al
 * SMTP: le pide todo a /api/leads con un secreto compartido. Aquí está lo
 * que esa ruta necesita: el cliente de Supabase con service role, la
 * búsqueda en Google Places, el envío con sus candados, y el enlace firmado
 * de baja.
 *
 * Variables de entorno (Vercel):
 *   LEADS_SECRET             secreto compartido con la sesión automática y
 *                            llave con la que se firman los enlaces de baja
 *   GOOGLE_PLACES_API_KEY    llave de Places API (New), restringida a esa API
 *   LEADS_MODO               'prueba' (por defecto) o 'real'. En prueba, todo
 *                            correo va a LEADS_CORREO_PRUEBA en vez del negocio
 *   LEADS_CORREO_PRUEBA      a dónde llegan los correos en modo prueba
 *   LEADS_FROM               remitente, ej. "Junior Osorio <junior@judomarketing.net>"
 *                            (debe ser un alias "Send mail as" de la cuenta SMTP)
 *   LEADS_REPLY_TO           a dónde llegan las respuestas
 *   LEADS_MAX_DIA            tope de correos reales por día (10 por defecto)
 *   LEADS_COPIA              copia oculta de cada correo que sale, para auditar
 *                            (admin@judomarketing.net por defecto; vacío para no copiar)
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "node:crypto";
import { sendBrandedEmail } from "@/lib/email";
import {
  enlacesProspecto,
  htmlProspecto,
  textoProspecto,
  type IdiomaCorreo,
} from "@/lib/leads-correo";

const SITIO = "https://www.judomarketing.net";

// ---------------------------------------------------------------- países

export type Pais = "us" | "es" | "uk" | "de";

/**
 * Lo que cambia por país al hablar con Google y al escribir. El idioma
 * "auto" es el del website del negocio (Estados Unidos: inglés o español);
 * en los demás países se escribe en el idioma del país.
 */
export const PAISES: Record<Pais, { nombre: string; languageCode: string; regionCode: string; gl: string; idioma: IdiomaCorreo | "auto" }> = {
  us: { nombre: "Estados Unidos", languageCode: "en", regionCode: "US", gl: "us", idioma: "auto" },
  es: { nombre: "España", languageCode: "es", regionCode: "ES", gl: "es", idioma: "es" },
  uk: { nombre: "Reino Unido", languageCode: "en-GB", regionCode: "GB", gl: "uk", idioma: "en" },
  de: { nombre: "Alemania", languageCode: "de", regionCode: "DE", gl: "de", idioma: "de" },
};

/** Una zona es un zip de Florida ("33130") o "país:ciudad" ("us:austin-tx", "es:sevilla"). */
export const ZONA_RE = /^(\d{5}|(us|es|uk|de):[a-z0-9-]{2,60})$/;

export function paisDeZona(zip: string): Pais {
  const m = /^(us|es|uk|de):/.exec(zip);
  return m ? (m[1] as Pais) : "us";
}

/** Lo que la sesión manda para buscar: la zona tal cual está en scripts/leads/zonas.json. */
export type Zona = { id: string; consulta: string; verificar: string[] };

export function zonaValida(z: unknown): z is Zona {
  const o = z as Zona;
  return (
    !!o &&
    typeof o.id === "string" &&
    ZONA_RE.test(o.id) &&
    typeof o.consulta === "string" &&
    o.consulta.length > 0 &&
    o.consulta.length <= 120 &&
    Array.isArray(o.verificar) &&
    o.verificar.length > 0 &&
    o.verificar.every((v) => typeof v === "string" && v.length > 0 && v.length <= 60)
  );
}

// Un correo por negocio, y nunca más. Sin recontacto: a quien ya se le
// escribió no se le vuelve a escribir, ni contestó ni pidió baja ni nada.
export const ESTADOS_QUE_NO_SE_ESCRIBEN = new Set([
  "enviado",
  "baja",
  "rebotado",
  "respondio",
  "cliente",
  "descartado",
]);

// ---------------------------------------------------------------- acceso

export function secretoLeads(): string | null {
  const s = process.env.LEADS_SECRET;
  return s && s.length >= 16 ? s : null;
}

/** Compara el Bearer de la petición con LEADS_SECRET sin filtrar por tiempo. */
export function autorizado(cabeceraAuthorization: string | null): boolean {
  const secreto = secretoLeads();
  if (!secreto) return false;
  const token = (cabeceraAuthorization ?? "").startsWith("Bearer ")
    ? (cabeceraAuthorization ?? "").slice(7)
    : "";
  if (!token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(secreto);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function clienteServicio(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const llave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !llave) throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, llave, { auth: { persistSession: false } });
}

// ------------------------------------------------------------------ baja

function firmaBaja(email: string): string {
  const secreto = secretoLeads();
  if (!secreto) throw new Error("Falta LEADS_SECRET");
  return createHmac("sha256", secreto)
    .update(email.trim().toLowerCase())
    .digest("base64url")
    .slice(0, 32);
}

export function urlBaja(email: string, idioma: IdiomaCorreo): string {
  const e = Buffer.from(email.trim().toLowerCase()).toString("base64url");
  return `${SITIO}/api/leads/baja?e=${e}&t=${firmaBaja(email)}&l=${idioma}`;
}

// ------------------------------------------------------------------ clics

function firmaClic(leadId: string, accion: string): string {
  const secreto = secretoLeads();
  if (!secreto) throw new Error("Falta LEADS_SECRET");
  return createHmac("sha256", secreto).update(`clic|${leadId}|${accion}`).digest("base64url").slice(0, 24);
}

/** Los dos botones del correo pasan por el sitio para saber qué negocio hizo clic. */
export function enlacesConSeguimiento(leadId: string, idioma: IdiomaCorreo, zip: string) {
  const directo = enlacesProspecto(idioma, zip);
  const url = (accion: "contacto" | "showcase") =>
    `${SITIO}/api/leads/clic?l=${encodeURIComponent(leadId)}&a=${accion}&t=${firmaClic(leadId, accion)}&i=${idioma}&z=${encodeURIComponent(zip)}`;
  return { contacto: url("contacto"), showcase: url("showcase"), directo };
}

export function verificarClic(l: string | null, a: string | null, t: string | null): { leadId: string; accion: "contacto" | "showcase" } | null {
  if (!l || !t || (a !== "contacto" && a !== "showcase")) return null;
  if (!/^[0-9a-f-]{36}$/i.test(l)) return null;
  const esperada = Buffer.from(firmaClic(l, a));
  const recibida = Buffer.from(t);
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) return null;
  return { leadId: l, accion: a };
}

/** Anota el clic en las señales del lead (sin migración nueva) y no falla nunca. */
export async function registrarClic(leadId: string, accion: string): Promise<void> {
  try {
    const supabase = clienteServicio();
    const { data } = await supabase.from("leads").select("senales").eq("id", leadId).maybeSingle();
    const senales: string[] = Array.isArray(data?.senales) ? data!.senales : [];
    senales.push(`clic:${accion}:${new Date().toISOString().slice(0, 16)}Z`);
    await supabase.from("leads").update({ senales: senales.slice(-60) }).eq("id", leadId);
  } catch (e) {
    console.error("leads/clic: no se pudo anotar", leadId, (e as Error).message);
  }
}

/** Devuelve el correo si la firma es válida; null si el enlace fue manipulado. */
export function verificarBaja(e: string | null, t: string | null): string | null {
  if (!e || !t) return null;
  let email: string;
  try {
    email = Buffer.from(e, "base64url").toString("utf8");
  } catch {
    return null;
  }
  if (!email.includes("@") || email.length > 200) return null;
  const esperada = Buffer.from(firmaBaja(email));
  const recibida = Buffer.from(t);
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) return null;
  return email.toLowerCase();
}

// ---------------------------------------------------------- Google Places

export type Candidato = {
  place_id: string;
  nombre: string;
  direccion: string;
  telefono: string | null;
  website: string | null;
  rating: number | null;
  resenas: number | null;
  tipo_google: string | null;
  tipos: string[];
  maps: string | null;
};

// Rubros que buscamos en cada código postal. El orden rota por corrida para
// que dos zips seguidos no traigan el mismo tipo de negocio primero.
const CONSULTAS = [
  "restaurant",
  "auto repair shop",
  "beauty salon",
  "dental clinic",
  "contractor",
  "cleaning service",
  "warehouse",
  "law firm",
  "accounting firm",
  "gym",
  "real estate agency",
  "medical clinic",
  "moving company",
  "plumber",
  "electrician",
  "bakery",
  "clothing store",
  "daycare",
  "tutoring center",
  "landscaping",
  "wholesale distributor",
  "physical therapy",
  "barber shop",
  "car dealership",
  "print shop",
  "pet groomer",
  "insurance agency",
  "spa",
  "furniture store",
  "catering",
];

// Lo que no es un cliente nuestro: gobierno, culto, hospitales, bancos,
// cadenas nacionales. Tipos de Google Places y palabras en el nombre.
const TIPOS_FUERA = new Set([
  "school",
  "primary_school",
  "secondary_school",
  "university",
  "church",
  "hindu_temple",
  "mosque",
  "synagogue",
  "hospital",
  "bank",
  "atm",
  "government_office",
  "local_government_office",
  "city_hall",
  "courthouse",
  "police",
  "fire_station",
  "post_office",
  "library",
  "park",
  "embassy",
  "transit_station",
  "bus_station",
  "train_station",
  "airport",
  "parking",
  "gas_station",
  "cemetery",
  "funeral_home",
]);

const NOMBRES_FUERA =
  /\b(mcdonald|starbucks|walgreens|cvs|publix|walmart|target|home depot|lowe'?s|costco|sam'?s club|bj'?s|aldi|whole foods|trader joe|winn.?dixie|sedano|presidente|navarro|dollar (tree|general)|family dollar|ross|marshalls|tj maxx|burlington|best buy|gamestop|petsmart|petco|planet fitness|la fitness|orangetheory|youfit|crunch fitness|anytime fitness|great clips|supercuts|sport clips|european wax|massage envy|hand (&|and) stone|banfield|vca |quest diagnostics|labcorp|minuteclinic|baptist health|jackson (health|memorial)|hca |mount sinai|nicklaus|cleveland clinic|subway|domino|pizza hut|papa john|dunkin|7.?eleven|wendy|burger king|chick.?fil|taco bell|kfc|popeyes|chipotle|panera|denny|ihop|chili'?s|applebee|olive garden|outback|sephora|ulta|zara|h&m|nike|apple store|t.?mobile|verizon|at&t|metro by|boost mobile|cricket wireless|amazon|fedex|ups store|usps|enterprise rent|hertz|avis|budget rent|marriott|hilton|holiday inn|hampton inn|hyatt|autozone|advance auto|o'?reilly|pep boys|jiffy lube|midas|firestone|goodyear|h&r block|jackson hewitt|liberty tax|chase|bank of america|wells fargo|citibank|td bank|pnc|truist|regions|capital one|western union|moneygram|city of|county|state of|department of|iglesia|church|ministerio|ministry|police|fire rescue|school|elementary|academy of|hospital|clínica jackson)\b/i;

const CAMPOS_PLACES =
  "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.primaryType,places.types,places.businessStatus,places.googleMapsUri,nextPageToken";

type RespuestaPlaces = {
  places?: Array<{
    id: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    nationalPhoneNumber?: string;
    websiteUri?: string;
    rating?: number;
    userRatingCount?: number;
    primaryType?: string;
    types?: string[];
    businessStatus?: string;
    googleMapsUri?: string;
  }>;
  nextPageToken?: string;
  error?: { message?: string };
};

/**
 * Hasta `maximo` negocios operativos de una zona (un zip de Florida o una
 * ciudad de cualquiera de los países), sin cadenas ni entidades que no son
 * clientes. Cuesta una llamada a Places por página (20 resultados); una zona
 * completa son entre 10 y 30 llamadas.
 */
export async function buscarNegocios(
  zona: Zona,
  maximo = 100,
  semilla = 0
): Promise<{ candidatos: Candidato[]; consultas: number; aviso?: string }> {
  const llave = process.env.GOOGLE_PLACES_API_KEY;
  if (!llave) throw new Error("Falta GOOGLE_PLACES_API_KEY");

  const pais = PAISES[paisDeZona(zona.id)];
  const verificar = zona.verificar.map((v) => v.toLowerCase());
  const vistos = new Map<string, Candidato>();
  let consultas = 0;
  let aviso: string | undefined;
  const orden = [...CONSULTAS.slice(semilla % CONSULTAS.length), ...CONSULTAS.slice(0, semilla % CONSULTAS.length)];

  for (const rubro of orden) {
    if (vistos.size >= maximo) break;
    let pageToken: string | undefined;
    for (let pagina = 0; pagina < 3 && vistos.size < maximo; pagina++) {
      consultas++;
      const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": llave,
          "X-Goog-FieldMask": CAMPOS_PLACES,
        },
        body: JSON.stringify({
          textQuery: `${rubro} in ${zona.consulta}`,
          pageSize: 20,
          languageCode: pais.languageCode,
          regionCode: pais.regionCode,
          ...(pageToken ? { pageToken } : {}),
        }),
      });
      const datos = (await res.json()) as RespuestaPlaces;
      if (!res.ok) {
        aviso = `Places respondió ${res.status}: ${datos.error?.message ?? "sin detalle"}`;
        return { candidatos: [...vistos.values()], consultas, aviso };
      }
      for (const p of datos.places ?? []) {
        if (vistos.has(p.id)) continue;
        const direccion = p.formattedAddress ?? "";
        // Places entiende "in 33130" o "in Sevilla" como zona, no como
        // filtro: comprobamos que la dirección sea de ahí.
        const dir = direccion.toLowerCase();
        if (!verificar.some((v) => dir.includes(v))) continue;
        if (p.businessStatus && p.businessStatus !== "OPERATIONAL") continue;
        const tipos = p.types ?? [];
        if (tipos.some((t) => TIPOS_FUERA.has(t))) continue;
        const nombre = p.displayName?.text ?? "";
        if (!nombre || NOMBRES_FUERA.test(nombre)) continue;
        vistos.set(p.id, {
          place_id: p.id,
          nombre,
          direccion,
          telefono: p.nationalPhoneNumber ?? null,
          website: p.websiteUri ?? null,
          rating: p.rating ?? null,
          resenas: p.userRatingCount ?? null,
          tipo_google: p.primaryType ?? null,
          tipos,
          maps: p.googleMapsUri ?? null,
        });
        if (vistos.size >= maximo) break;
      }
      pageToken = datos.nextPageToken;
      if (!pageToken) break;
    }
  }
  return { candidatos: [...vistos.values()], consultas, aviso };
}

/**
 * Busca UN negocio por nombre y ciudad, para saber si un registro de Sunbiz
 * existe en Google. Solo campos básicos (SKU barato); el detalle (website,
 * teléfono) se pide aparte y solo para los que interesan.
 */
export async function buscarPorNombre(
  nombre: string,
  ciudad: string,
  zip: string
): Promise<{ place_id: string; nombre: string; direccion: string; mismo_zip: boolean } | null> {
  const llave = process.env.GOOGLE_PLACES_API_KEY;
  if (!llave) throw new Error("Falta GOOGLE_PLACES_API_KEY");
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": llave,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress",
    },
    body: JSON.stringify({
      textQuery: `${nombre} ${ciudad} FL`,
      pageSize: 3,
      languageCode: "en",
      regionCode: "US",
    }),
  });
  const datos = (await res.json()) as RespuestaPlaces;
  if (!res.ok) throw new Error(`Places respondió ${res.status}: ${datos.error?.message ?? "sin detalle"}`);
  const limpio = (t: string) =>
    t.toUpperCase().replace(/\b(LLC|L\.L\.C\.?|INC\.?|CORP\.?|CORPORATION|CO\.?|LTD\.?|THE)\b/g, "").replace(/[^A-Z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  const buscado = limpio(nombre);
  const palabras = buscado.split(" ").filter((w) => w.length > 2);
  for (const p of datos.places ?? []) {
    const encontrado = limpio(p.displayName?.text ?? "");
    const coincidencias = palabras.filter((w) => encontrado.includes(w)).length;
    // Casi todas las palabras significativas del nombre tienen que estar
    // (todas si son tres o menos), y la dirección tiene que ser del mismo zip
    // o de la misma ciudad. "Family Circle Cleaning" de Weston no es "Family
    // cleaning services" de Pembroke Pines.
    const minimo = palabras.length <= 3 ? palabras.length : Math.ceil(palabras.length * 0.75);
    if (palabras.length === 0 || coincidencias < minimo) continue;
    const direccion = p.formattedAddress ?? "";
    const mismoZip = direccion.includes(zip);
    const mismaCiudad = ciudad.length > 2 && direccion.toLowerCase().includes(ciudad.toLowerCase());
    if (!mismoZip && !mismaCiudad) continue;
    return { place_id: p.id, nombre: p.displayName?.text ?? "", direccion, mismo_zip: mismoZip };
  }
  return null;
}

/** Website, teléfono y reseñas de un negocio ya identificado. */
export async function detallePlace(placeId: string): Promise<Omit<Candidato, "place_id" | "nombre" | "direccion">> {
  const llave = process.env.GOOGLE_PLACES_API_KEY;
  if (!llave) throw new Error("Falta GOOGLE_PLACES_API_KEY");
  const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: {
      "X-Goog-Api-Key": llave,
      "X-Goog-FieldMask": "nationalPhoneNumber,websiteUri,rating,userRatingCount,primaryType,types,googleMapsUri,businessStatus",
    },
  });
  const p = (await res.json()) as NonNullable<RespuestaPlaces["places"]>[number] & { error?: { message?: string } };
  if (!res.ok) throw new Error(`Places respondió ${res.status}: ${p.error?.message ?? "sin detalle"}`);
  return {
    telefono: p.nationalPhoneNumber ?? null,
    website: p.websiteUri ?? null,
    rating: p.rating ?? null,
    resenas: p.userRatingCount ?? null,
    tipo_google: p.primaryType ?? null,
    tipos: p.types ?? [],
    maps: p.googleMapsUri ?? null,
  };
}

// ------------------------------------------------------- informe público

export type Competidor = { nombre: string; rating: number | null; resenas: number | null };

/**
 * En qué puesto sale un negocio en Google Maps para una búsqueda de su zona,
 * y quiénes van delante. Es el mismo orden que Places devuelve para esa
 * consulta: real, aunque el orden exacto varía según desde dónde se busque.
 */
export async function posicionEnMaps(
  consulta: string,
  zip: string,
  placeId: string,
  lugar?: string
): Promise<{ consulta: string; posicion: number | null; revisados: number; primeros: Competidor[] }> {
  const llave = process.env.GOOGLE_PLACES_API_KEY;
  if (!llave) throw new Error("Falta GOOGLE_PLACES_API_KEY");
  const pais = PAISES[paisDeZona(zip)];
  const donde = lugar?.trim() || zip;
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": llave,
      "X-Goog-FieldMask": "places.id,places.displayName,places.rating,places.userRatingCount",
    },
    body: JSON.stringify({ textQuery: `${consulta} in ${donde}`, pageSize: 20, languageCode: pais.languageCode, regionCode: pais.regionCode }),
  });
  const datos = (await res.json()) as RespuestaPlaces;
  if (!res.ok) throw new Error(`Places respondió ${res.status}: ${datos.error?.message ?? "sin detalle"}`);
  const lista = datos.places ?? [];
  const i = lista.findIndex((p) => p.id === placeId);
  return {
    consulta: `${consulta} in ${donde}`,
    posicion: i >= 0 ? i + 1 : null,
    revisados: lista.length,
    primeros: lista.slice(0, 3).map((p) => ({ nombre: p.displayName?.text ?? "", rating: p.rating ?? null, resenas: p.userRatingCount ?? null })),
  };
}

export type ResultadoPageSpeed = {
  url: string;
  estrategia: "mobile" | "desktop";
  puntajes: { rendimiento: number | null; seo: number | null; accesibilidad: number | null; buenas_practicas: number | null };
  metricas: { lcp: string | null; fcp: string | null; cls: string | null; tbt: string | null; velocidad: string | null };
  auditorias: Record<string, boolean | null>;
  crux: { categoria: string; lcp: string | null; cls: string | null; inp: string | null } | null;
};

/** Lo que Google mide de una página (Lighthouse), tal cual PageSpeed Insights. */
export async function pageSpeed(url: string, estrategia: "mobile" | "desktop" = "mobile"): Promise<ResultadoPageSpeed> {
  const llave = process.env.GOOGLE_PAGESPEED_API_KEY ?? process.env.GOOGLE_PLACES_API_KEY;
  if (!llave) throw new Error("Falta GOOGLE_PAGESPEED_API_KEY o GOOGLE_PLACES_API_KEY");
  const q = new URLSearchParams({ url, strategy: estrategia, key: llave });
  for (const c of ["performance", "seo", "accessibility", "best-practices"]) q.append("category", c);
  const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${q}`, { signal: AbortSignal.timeout(100_000) });
  const datos = (await res.json()) as {
    error?: { message?: string };
    lighthouseResult?: {
      categories?: Record<string, { score: number | null }>;
      audits?: Record<string, { score: number | null; displayValue?: string }>;
    };
    loadingExperience?: { overall_category?: string; metrics?: Record<string, { category?: string; percentile?: number }> };
  };
  if (!res.ok) throw new Error(`PageSpeed respondió ${res.status}: ${datos.error?.message ?? "sin detalle"}`);
  const cat = datos.lighthouseResult?.categories ?? {};
  const a = datos.lighthouseResult?.audits ?? {};
  const puntaje = (k: string) => (cat[k]?.score == null ? null : Math.round((cat[k].score as number) * 100));
  const valor = (k: string) => a[k]?.displayValue ?? null;
  const pasa = (k: string) => (a[k]?.score == null ? null : a[k].score === 1);
  const cx = datos.loadingExperience;
  const ms = (k: string) => {
    const p = cx?.metrics?.[k]?.percentile;
    return p == null ? null : k === "CUMULATIVE_LAYOUT_SHIFT_SCORE" ? (p / 100).toFixed(2) : `${(p / 1000).toFixed(1)} s`;
  };
  return {
    url,
    estrategia,
    puntajes: { rendimiento: puntaje("performance"), seo: puntaje("seo"), accesibilidad: puntaje("accessibility"), buenas_practicas: puntaje("best-practices") },
    metricas: { lcp: valor("largest-contentful-paint"), fcp: valor("first-contentful-paint"), cls: valor("cumulative-layout-shift"), tbt: valor("total-blocking-time"), velocidad: valor("speed-index") },
    auditorias: {
      viewport: pasa("viewport"),
      titulo: pasa("document-title"),
      meta_descripcion: pasa("meta-description"),
      rastreable: pasa("is-crawlable"),
      alt_imagenes: pasa("image-alt"),
      https: pasa("is-on-https"),
      enlaces_descriptivos: pasa("link-text"),
      texto_legible: pasa("font-size"),
      botones_tocables: pasa("tap-targets"),
    },
    crux: cx?.overall_category
      ? { categoria: cx.overall_category, lcp: ms("LARGEST_CONTENTFUL_PAINT_MS"), cls: ms("CUMULATIVE_LAYOUT_SHIFT_SCORE"), inp: ms("INTERACTION_TO_NEXT_PAINT") }
      : null,
  };
}

/**
 * En qué puesto sale el dominio del negocio en la búsqueda web de Google
 * para una consulta. Usa un Programmable Search Engine configurado para
 * buscar en toda la web (GOOGLE_CSE_ID); sin eso, se informa como no
 * configurado y el informe omite esa línea.
 */
export async function posicionWeb(
  consulta: string,
  dominio: string,
  idioma: IdiomaCorreo = "en",
  pais: Pais = "us"
): Promise<{ configurado: boolean; consulta: string; posicion: number | null; revisados: number; primeros: string[] }> {
  const cx = process.env.GOOGLE_CSE_ID;
  const llave = process.env.GOOGLE_CSE_API_KEY ?? process.env.GOOGLE_PLACES_API_KEY;
  if (!cx || !llave) return { configurado: false, consulta, posicion: null, revisados: 0, primeros: [] };
  const dom = dominio.replace(/^www\./, "").toLowerCase();
  const enlaces: string[] = [];
  for (const start of [1, 11]) {
    const q = new URLSearchParams({ key: llave, cx, q: consulta, gl: PAISES[pais].gl, hl: idioma, num: "10", start: String(start) });
    const res = await fetch(`https://www.googleapis.com/customsearch/v1?${q}`);
    const datos = (await res.json()) as { error?: { message?: string }; items?: Array<{ link: string }> };
    if (!res.ok) throw new Error(`Custom Search respondió ${res.status}: ${datos.error?.message ?? "sin detalle"}`);
    enlaces.push(...(datos.items ?? []).map((i) => i.link));
    if (enlaces.some((l) => l.toLowerCase().includes(dom))) break;
    if ((datos.items ?? []).length < 10) break;
  }
  const i = enlaces.findIndex((l) => {
    try {
      return new URL(l).hostname.replace(/^www\./, "").toLowerCase() === dom;
    } catch {
      return false;
    }
  });
  return {
    configurado: true,
    consulta,
    posicion: i >= 0 ? i + 1 : null,
    revisados: enlaces.length,
    primeros: enlaces.slice(0, 3).map((l) => {
      try {
        return new URL(l).hostname.replace(/^www\./, "");
      } catch {
        return l;
      }
    }),
  };
}

// ---------------------------------------------------------------- reporte

/** Bajas, clics, respuestas y envíos: lo que Junior audita. */
export async function reporte(desde?: string) {
  const supabase = clienteServicio();
  const limite = desde && !Number.isNaN(Date.parse(desde)) ? new Date(desde).toISOString() : null;
  const { data, error } = await supabase
    .from("leads")
    .select("id, nombre, email, zip, rubro, estado, enviado_en, baja_en, senales, notas")
    .in("estado", ["enviado", "baja", "rebotado", "respondio", "cliente"])
    .order("enviado_en", { ascending: false })
    .limit(2000);
  if (error) throw error;
  const filas = data ?? [];
  const clicsDe = (f: { senales: unknown }) =>
    (Array.isArray(f.senales) ? (f.senales as string[]) : [])
      .filter((x) => x.startsWith("clic:"))
      .map((x) => {
        const [, accion, en] = x.split(":");
        return { accion, en: x.slice(x.indexOf(":", 6) + 1) || en };
      });
  const reciente = (fecha: string | null) => !limite || (fecha != null && fecha >= limite);
  const enviados = filas.filter((f) => f.enviado_en && reciente(f.enviado_en));
  const bajas = filas.filter((f) => f.estado === "baja" && reciente(f.baja_en)).map((f) => ({ nombre: f.nombre, email: f.email, zip: f.zip, rubro: f.rubro, enviado_en: f.enviado_en, baja_en: f.baja_en }));
  const clics = filas
    .map((f) => ({ nombre: f.nombre, email: f.email, zip: f.zip, rubro: f.rubro, estado: f.estado, enviado_en: f.enviado_en, clics: clicsDe(f).filter((c) => reciente(c.en)) }))
    .filter((f) => f.clics.length > 0);
  const respondieron = filas.filter((f) => ["respondio", "cliente"].includes(f.estado)).map((f) => ({ nombre: f.nombre, email: f.email, estado: f.estado, notas: f.notas }));
  return {
    desde: limite,
    enviados: { total: enviados.length, por_dia: Object.entries(enviados.reduce((a: Record<string, number>, f) => ((a[String(f.enviado_en).slice(0, 10)] = (a[String(f.enviado_en).slice(0, 10)] ?? 0) + 1), a), {})).sort() },
    bajas,
    clics,
    respondieron,
    rebotados: filas.filter((f) => f.estado === "rebotado").length,
  };
}

// ------------------------------------------------------------------ envío

export type Borrador = {
  lead_id: string;
  idioma: IdiomaCorreo;
  asunto: string;
  saludo: string;
  parrafos: string[];
  ps?: string;
  /** Nuestra lectura del rubro, para guardarla con el lead. */
  rubro?: string;
  /** Cómo se nombra la zona en el pie del correo ("Brickell", "Sevilla"). */
  lugar?: string;
  /** El informe de presencia en línea, en PDF (base64), cuando el negocio tiene website. */
  adjunto?: { nombre: string; base64: string };
};

export type ResultadoEnvio = {
  lead_id: string;
  ok: boolean;
  a?: string;
  motivo?: string;
};

function modoPrueba(): boolean {
  return (process.env.LEADS_MODO ?? "prueba") !== "real";
}

function remitente(): string {
  return process.env.LEADS_FROM ?? '"Junior Osorio, Judo Marketing" <info@judomarketing.net>';
}

function direccionRespuestas(): string {
  return process.env.LEADS_REPLY_TO ?? "admin@judomarketing.net";
}

function copiaOculta(): string | undefined {
  const c = process.env.LEADS_COPIA ?? "admin@judomarketing.net";
  return c.trim() ? c.trim() : undefined;
}

function validarBorrador(b: Borrador): string | null {
  if (!b.lead_id || !b.asunto || !b.saludo || !Array.isArray(b.parrafos) || b.parrafos.length === 0) {
    return "borrador incompleto";
  }
  if (b.idioma !== "es" && b.idioma !== "en" && b.idioma !== "de") return "idioma inválido";
  if (b.asunto.length > 90) return "asunto de más de 90 caracteres";
  if (b.lugar && b.lugar.length > 80) return "lugar de más de 80 caracteres";
  const palabras = b.parrafos.join(" ").split(/\s+/).length;
  if (palabras > 170) return `cuerpo demasiado largo (${palabras} palabras; máximo 170)`;
  if (palabras < 40) return `cuerpo demasiado corto (${palabras} palabras)`;
  if (/[—–]/.test([b.asunto, b.saludo, ...b.parrafos, b.ps ?? ""].join(" "))) {
    return "lleva raya larga; se escribe con comas o puntos";
  }
  if (b.adjunto) {
    if (!/^[\w.-]+\.pdf$/i.test(b.adjunto.nombre)) return "el adjunto tiene que ser un .pdf con nombre simple";
    if (b.adjunto.base64.length > 2_000_000) return "adjunto de más de 1,5 MB";
  }
  return null;
}

/**
 * Manda los borradores. Cada lead pasa por los candados: existe, tiene
 * correo, no está de baja ni contestó, nunca se le escribió, y no se pasa
 * el tope diario de su país (LEADS_MAX_DIA por país). En modo prueba todo
 * va a LEADS_CORREO_PRUEBA y el lead no cambia de estado.
 */
export async function enviarBorradores(borradores: Borrador[]): Promise<{
  modo: "prueba" | "real";
  resultados: ResultadoEnvio[];
}> {
  const supabase = clienteServicio();
  const prueba = modoPrueba();
  const correoPrueba = process.env.LEADS_CORREO_PRUEBA ?? "admin@judomarketing.net";
  const tope = Number(process.env.LEADS_MAX_DIA ?? 10);
  const resultados: ResultadoEnvio[] = [];

  // Cuántos salieron hoy en cada país: el tope es por país, no global.
  const inicioDia = new Date();
  inicioDia.setUTCHours(0, 0, 0, 0);
  const enviadosHoy: Record<Pais, number> = { us: 0, es: 0, uk: 0, de: 0 };
  if (!prueba) {
    const { data } = await supabase.from("leads").select("zip").gte("enviado_en", inicioDia.toISOString()).limit(500);
    for (const f of data ?? []) enviadosHoy[paisDeZona(String(f.zip))]++;
  }

  for (const b of borradores) {
    const invalido = validarBorrador(b);
    if (invalido) {
      resultados.push({ lead_id: b.lead_id, ok: false, motivo: invalido });
      continue;
    }
    const { data: lead } = await supabase
      .from("leads")
      .select("id, nombre, zip, email, estado, enviado_en")
      .eq("id", b.lead_id)
      .maybeSingle();
    if (!lead) {
      resultados.push({ lead_id: b.lead_id, ok: false, motivo: "lead no existe" });
      continue;
    }
    if (!lead.email) {
      resultados.push({ lead_id: b.lead_id, ok: false, motivo: "lead sin correo" });
      continue;
    }
    if (ESTADOS_QUE_NO_SE_ESCRIBEN.has(lead.estado)) {
      resultados.push({ lead_id: b.lead_id, ok: false, motivo: `estado ${lead.estado}` });
      continue;
    }
    if (lead.enviado_en) {
      resultados.push({ lead_id: b.lead_id, ok: false, motivo: "ya se le escribió; sin recontacto" });
      continue;
    }
    const pais = paisDeZona(lead.zip as string);
    if (!prueba && enviadosHoy[pais] >= tope) {
      resultados.push({ lead_id: b.lead_id, ok: false, motivo: `tope diario de ${tope} alcanzado en ${PAISES[pais].nombre}` });
      continue;
    }

    const correo = {
      idioma: b.idioma,
      negocio: lead.nombre as string,
      saludo: b.saludo,
      parrafos: b.parrafos,
      ps: b.ps,
      zip: lead.zip as string,
      lugar: b.lugar,
      urlBaja: urlBaja(lead.email, b.idioma),
      enlaces: (() => {
        const e = enlacesConSeguimiento(lead.id as string, b.idioma, lead.zip as string);
        return { contacto: e.contacto, showcase: e.showcase };
      })(),
    };
    const html = htmlProspecto(correo);
    const texto = textoProspecto(correo);
    const destinatario = prueba ? correoPrueba : (lead.email as string);
    const asunto = prueba ? `[PRUEBA para ${lead.email}] ${b.asunto}` : b.asunto;

    try {
      const salio = await sendBrandedEmail(destinatario, asunto, html, {
        from: remitente(),
        replyTo: direccionRespuestas(),
        bcc: copiaOculta(),
        texto,
        adjuntos: b.adjunto
          ? [{ nombre: b.adjunto.nombre, contenido: Buffer.from(b.adjunto.base64, "base64"), tipo: "application/pdf" }]
          : undefined,
        headers: {
          "List-Unsubscribe": `<${correo.urlBaja}>, <mailto:${direccionRespuestas()}?subject=baja>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });
      if (!salio) {
        resultados.push({ lead_id: b.lead_id, ok: false, motivo: "SMTP no configurado (SMTP_USER / SMTP_PASS)" });
        continue;
      }
    } catch (e) {
      resultados.push({ lead_id: b.lead_id, ok: false, motivo: `SMTP: ${(e as Error).message}` });
      continue;
    }

    if (!prueba) {
      enviadosHoy[pais]++;
      await supabase
        .from("leads")
        .update({
          estado: "enviado",
          enviado_en: new Date().toISOString(),
          asunto: b.asunto,
          cuerpo: texto,
          idioma: b.idioma,
          borrador: null,
          borrador_en: null,
          ...(b.rubro ? { rubro: b.rubro } : {}),
        })
        .eq("id", b.lead_id);
    }
    resultados.push({ lead_id: b.lead_id, ok: true, a: destinatario });
  }

  return { modo: prueba ? "prueba" : "real", resultados };
}

// ------------------------------------------------ borradores y envío diario

const BUCKET_LEADS = "leads";
const DIAS_VIGENCIA_BORRADOR = 3;

/**
 * Guarda los borradores en el lead (y el PDF en Storage) sin mandar nada.
 * La sesión automática corre en un modo que no le permite mandar correos
 * reales; el envío lo hace el sitio desde /api/leads/cron. Mismos candados
 * que el envío: solo leads nuevos, con correo, nunca escritos.
 */
export async function guardarBorradores(borradores: Borrador[]): Promise<{ resultados: ResultadoEnvio[] }> {
  const supabase = clienteServicio();
  const resultados: ResultadoEnvio[] = [];
  for (const b of borradores) {
    const invalido = validarBorrador(b);
    if (invalido) {
      resultados.push({ lead_id: b.lead_id, ok: false, motivo: invalido });
      continue;
    }
    const { data: lead } = await supabase.from("leads").select("id, email, estado, enviado_en").eq("id", b.lead_id).maybeSingle();
    if (!lead) {
      resultados.push({ lead_id: b.lead_id, ok: false, motivo: "lead no existe" });
      continue;
    }
    if (!lead.email) {
      resultados.push({ lead_id: b.lead_id, ok: false, motivo: "lead sin correo" });
      continue;
    }
    if (ESTADOS_QUE_NO_SE_ESCRIBEN.has(lead.estado) || lead.enviado_en) {
      resultados.push({ lead_id: b.lead_id, ok: false, motivo: lead.enviado_en ? "ya se le escribió; sin recontacto" : `estado ${lead.estado}` });
      continue;
    }
    let informePath: string | null = null;
    if (b.adjunto) {
      informePath = `${b.lead_id}/${b.adjunto.nombre}`;
      const { error } = await supabase.storage
        .from(BUCKET_LEADS)
        .upload(informePath, Buffer.from(b.adjunto.base64, "base64"), { contentType: "application/pdf", upsert: true });
      if (error) {
        resultados.push({ lead_id: b.lead_id, ok: false, motivo: `no se pudo guardar el PDF: ${error.message} (¿falta la migración 0028?)` });
        continue;
      }
    }
    const { error } = await supabase
      .from("leads")
      .update({
        borrador: { idioma: b.idioma, asunto: b.asunto, saludo: b.saludo, parrafos: b.parrafos, ps: b.ps ?? null, rubro: b.rubro ?? null, lugar: b.lugar ?? null },
        borrador_en: new Date().toISOString(),
        informe_path: informePath,
        ...(b.rubro ? { rubro: b.rubro } : {}),
      })
      .eq("id", b.lead_id);
    if (error) {
      resultados.push({ lead_id: b.lead_id, ok: false, motivo: `${error.message} (¿falta la migración 0028?)` });
      continue;
    }
    resultados.push({ lead_id: b.lead_id, ok: true, a: lead.email as string });
  }
  return { resultados };
}

/**
 * Manda los borradores pendientes (de los últimos 3 días), por país y con
 * los topes de siempre. Lo llama el cron de Vercel una vez al día. Lo que
 * no pudo salir por tope se queda para mañana; lo que falló por otra razón
 * se descarta del borrador y queda anotado en el lead.
 */
export async function enviarPendientes(): Promise<{
  modo: "prueba" | "real";
  pendientes: number;
  enviados: Record<Pais, number>;
  resultados: Array<ResultadoEnvio & { nombre: string; pais: Pais }>;
}> {
  const supabase = clienteServicio();
  const desde = new Date(Date.now() - DIAS_VIGENCIA_BORRADOR * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from("leads")
    .select("id, nombre, zip, email, estado, enviado_en, borrador, borrador_en, informe_path")
    .not("borrador", "is", null)
    .is("enviado_en", null)
    .gte("borrador_en", desde)
    .order("borrador_en", { ascending: true })
    .limit(200);
  if (error) throw error;
  const filas = data ?? [];

  const borradores: Borrador[] = [];
  const nombres = new Map<string, { nombre: string; pais: Pais }>();
  for (const f of filas) {
    const b = f.borrador as Omit<Borrador, "lead_id" | "adjunto">;
    let adjunto: Borrador["adjunto"];
    if (f.informe_path) {
      const { data: pdf } = await supabase.storage.from(BUCKET_LEADS).download(f.informe_path as string);
      if (pdf) adjunto = { nombre: String(f.informe_path).split("/").pop() ?? "informe.pdf", base64: Buffer.from(await pdf.arrayBuffer()).toString("base64") };
    }
    borradores.push({ lead_id: f.id as string, idioma: b.idioma, asunto: b.asunto, saludo: b.saludo, parrafos: b.parrafos, ps: b.ps ?? undefined, rubro: b.rubro ?? undefined, lugar: b.lugar ?? undefined, adjunto });
    nombres.set(f.id as string, { nombre: f.nombre as string, pais: paisDeZona(f.zip as string) });
  }

  const { modo, resultados } = borradores.length ? await enviarBorradores(borradores) : { modo: modoPrueba() ? ("prueba" as const) : ("real" as const), resultados: [] };
  const enviados: Record<Pais, number> = { us: 0, es: 0, uk: 0, de: 0 };
  for (const r of resultados) {
    const n = nombres.get(r.lead_id);
    if (!n) continue;
    if (r.ok) {
      enviados[n.pais]++;
      if (modo === "prueba") await supabase.from("leads").update({ borrador: null, borrador_en: null }).eq("id", r.lead_id);
      continue;
    }
    // Sin cupo hoy: se queda para mañana. Cualquier otra causa: fuera.
    if (r.motivo?.startsWith("tope diario") || r.motivo?.startsWith("SMTP")) continue;
    await supabase
      .from("leads")
      .update({ borrador: null, borrador_en: null, notas: `borrador descartado: ${r.motivo}` })
      .eq("id", r.lead_id);
  }
  // Los PDF de lo que ya salió no hacen falta más.
  const enviadosPaths = filas.filter((f) => f.informe_path && resultados.some((r) => r.ok && r.lead_id === f.id)).map((f) => f.informe_path as string);
  if (enviadosPaths.length && modo === "real") await supabase.storage.from(BUCKET_LEADS).remove(enviadosPaths);

  return {
    modo,
    pendientes: filas.length,
    enviados,
    resultados: resultados.map((r) => ({ ...r, nombre: nombres.get(r.lead_id)?.nombre ?? "", pais: nombres.get(r.lead_id)?.pais ?? "us" })),
  };
}
