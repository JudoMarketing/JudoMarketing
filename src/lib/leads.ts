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
 *   LEADS_MAX_DIA            tope de correos reales por día (20 por defecto)
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "node:crypto";
import { sendBrandedEmail } from "@/lib/email";
import {
  htmlProspecto,
  textoProspecto,
  type IdiomaCorreo,
} from "@/lib/leads-correo";

const SITIO = "https://www.judomarketing.net";
const DIAS_SIN_REPETIR = 120;

export const ESTADOS_QUE_NO_SE_ESCRIBEN = new Set([
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
 * Hasta `maximo` negocios operativos de un código postal, sin cadenas ni
 * entidades que no son clientes. Cuesta una llamada a Places por página
 * (20 resultados); un zip completo son entre 10 y 30 llamadas.
 */
export async function buscarNegocios(
  zip: string,
  maximo = 100,
  semilla = 0
): Promise<{ candidatos: Candidato[]; consultas: number; aviso?: string }> {
  const llave = process.env.GOOGLE_PLACES_API_KEY;
  if (!llave) throw new Error("Falta GOOGLE_PLACES_API_KEY");

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
          textQuery: `${rubro} in ${zip}`,
          pageSize: 20,
          languageCode: "en",
          regionCode: "US",
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
        // Places entiende "in 33130" como zona, no como filtro: comprobamos el zip.
        if (!direccion.includes(zip)) continue;
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
    // La mayoría de las palabras significativas del nombre tienen que estar.
    if (palabras.length === 0 || coincidencias / palabras.length < 0.6) continue;
    const direccion = p.formattedAddress ?? "";
    return { place_id: p.id, nombre: p.displayName?.text ?? "", direccion, mismo_zip: direccion.includes(zip) };
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

function validarBorrador(b: Borrador): string | null {
  if (!b.lead_id || !b.asunto || !b.saludo || !Array.isArray(b.parrafos) || b.parrafos.length === 0) {
    return "borrador incompleto";
  }
  if (b.idioma !== "es" && b.idioma !== "en") return "idioma inválido";
  if (b.asunto.length > 90) return "asunto de más de 90 caracteres";
  const palabras = b.parrafos.join(" ").split(/\s+/).length;
  if (palabras > 260) return `cuerpo demasiado largo (${palabras} palabras)`;
  if (/[—–]/.test([b.asunto, b.saludo, ...b.parrafos, b.ps ?? ""].join(" "))) {
    return "lleva raya larga; se escribe con comas o puntos";
  }
  return null;
}

/**
 * Manda los borradores. Cada lead pasa por los candados: existe, tiene
 * correo, no está de baja ni contestó, no se le escribió en los últimos 120
 * días, y no se pasa el tope diario. En modo prueba todo va a
 * LEADS_CORREO_PRUEBA y el lead no cambia de estado.
 */
export async function enviarBorradores(borradores: Borrador[]): Promise<{
  modo: "prueba" | "real";
  resultados: ResultadoEnvio[];
}> {
  const supabase = clienteServicio();
  const prueba = modoPrueba();
  const correoPrueba = process.env.LEADS_CORREO_PRUEBA ?? "admin@judomarketing.net";
  const tope = Number(process.env.LEADS_MAX_DIA ?? 20);
  const resultados: ResultadoEnvio[] = [];

  if (borradores.length > tope) {
    return {
      modo: prueba ? "prueba" : "real",
      resultados: [{ lead_id: "*", ok: false, motivo: `más de ${tope} borradores en una corrida` }],
    };
  }

  const inicioDia = new Date();
  inicioDia.setUTCHours(0, 0, 0, 0);
  let enviadosHoy = 0;
  if (!prueba) {
    const { count } = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .gte("enviado_en", inicioDia.toISOString());
    enviadosHoy = count ?? 0;
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
      const dias = (Date.now() - new Date(lead.enviado_en).getTime()) / 86_400_000;
      if (dias < DIAS_SIN_REPETIR) {
        resultados.push({ lead_id: b.lead_id, ok: false, motivo: `ya se le escribió hace ${Math.floor(dias)} días` });
        continue;
      }
    }
    if (!prueba && enviadosHoy >= tope) {
      resultados.push({ lead_id: b.lead_id, ok: false, motivo: `tope diario de ${tope} alcanzado` });
      continue;
    }

    const correo = {
      idioma: b.idioma,
      negocio: lead.nombre as string,
      saludo: b.saludo,
      parrafos: b.parrafos,
      ps: b.ps,
      zip: lead.zip as string,
      urlBaja: urlBaja(lead.email, b.idioma),
    };
    const html = htmlProspecto(correo);
    const texto = textoProspecto(correo);
    const destinatario = prueba ? correoPrueba : (lead.email as string);
    const asunto = prueba ? `[PRUEBA para ${lead.email}] ${b.asunto}` : b.asunto;

    try {
      const salio = await sendBrandedEmail(destinatario, asunto, html, {
        from: remitente(),
        replyTo: direccionRespuestas(),
        texto,
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
      enviadosHoy++;
      await supabase
        .from("leads")
        .update({
          estado: "enviado",
          enviado_en: new Date().toISOString(),
          asunto: b.asunto,
          cuerpo: texto,
          idioma: b.idioma,
          ...(b.rubro ? { rubro: b.rubro } : {}),
        })
        .eq("id", b.lead_id);
    }
    resultados.push({ lead_id: b.lead_id, ok: true, a: destinatario });
  }

  return { modo: prueba ? "prueba" : "real", resultados };
}
