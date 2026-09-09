// Los datos de Google de cada website: Search Console y Analytics (GA4).
//
// Se entra con una CUENTA DE SERVICIO de Google Cloud, no con la cuenta de
// Junior: es un robot con su propio correo al que se le da acceso de lectura
// en cada propiedad de Search Console y de Analytics. Así no hay pantalla de
// "inicia sesión con Google" ni tokens que caducan a los siete días. La llave
// del robot vive en Vercel, en GOOGLE_SERVICE_ACCOUNT_JSON, y jamás en el
// navegador.
//
// Sin dependencias: el JWT se firma con el crypto de Node y las APIs se
// llaman con fetch. El paquete oficial "googleapis" pesa más que todo el
// sitio junto.
//
// Solo servidor.

import { createSign } from "node:crypto";

/** Lo que el portal enseña de Search Console: los últimos 28 días contra los 28 anteriores. */
export type ResumenGsc = {
  propiedad: string;
  desde: string;
  hasta: string;
  clics: number;
  impresiones: number;
  ctr: number;
  posicion: number;
  clicsAntes: number;
  impresionesAntes: number;
  consultas: { consulta: string; clics: number; impresiones: number; posicion: number }[];
};

/** Lo que el portal enseña de Analytics: los últimos 28 días contra los 28 anteriores. */
export type ResumenGa4 = {
  propiedad: string;
  usuarios: number;
  sesiones: number;
  vistas: number;
  usuariosAntes: number;
  sesionesAntes: number;
  paginas: { ruta: string; vistas: number }[];
};

export type GoogleDeSitio = {
  gsc: ResumenGsc | null;
  ga4: ResumenGa4 | null;
  /** Por qué falta cada fuente, en palabras que el portal enseña tal cual. */
  faltas: string[];
  tomado: string;
};

const ALCANCES = [
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/analytics.readonly",
].join(" ");

type Credenciales = { client_email: string; private_key: string };

export function credenciales(): Credenciales | null {
  const crudo = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!crudo) return null;
  try {
    // Vercel guarda el JSON tal cual; si alguien lo pegó en base64, también vale.
    const texto = crudo.trim().startsWith("{") ? crudo : Buffer.from(crudo, "base64").toString("utf8");
    const j = JSON.parse(texto) as Partial<Credenciales>;
    if (!j.client_email || !j.private_key) return null;
    return { client_email: j.client_email, private_key: j.private_key.replace(/\\n/g, "\n") };
  } catch {
    return null;
  }
}

/** El correo del robot, para decirle a Junior a quién dar acceso. */
export function correoDelRobot(): string | null {
  return credenciales()?.client_email ?? null;
}

const b64url = (s: Buffer | string) =>
  Buffer.from(s).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** Firma el JWT con el que la cuenta de servicio pide su token. Exportada para probarla. */
export function firmarJwt(c: Credenciales, ahora: number = Math.floor(Date.now() / 1000)): string {
  const cabecera = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const cuerpo = b64url(
    JSON.stringify({
      iss: c.client_email,
      scope: ALCANCES,
      aud: "https://oauth2.googleapis.com/token",
      iat: ahora,
      exp: ahora + 3600,
    })
  );
  const firmador = createSign("RSA-SHA256");
  firmador.update(`${cabecera}.${cuerpo}`);
  const firma = b64url(firmador.sign(c.private_key));
  return `${cabecera}.${cuerpo}.${firma}`;
}

// El token dura una hora; se guarda en memoria y se pide otro cuando falte poco.
let tokenGuardado: { valor: string; vence: number } | null = null;

async function token(): Promise<string> {
  if (tokenGuardado && tokenGuardado.vence > Date.now() + 60_000) return tokenGuardado.valor;
  const c = credenciales();
  if (!c) throw new Error("Falta GOOGLE_SERVICE_ACCOUNT_JSON en Vercel.");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: firmarJwt(c),
    }),
    cache: "no-store",
  });
  const j = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!res.ok || !j.access_token) {
    throw new Error(`Google no dio token: ${j.error_description ?? res.status}`);
  }
  tokenGuardado = { valor: j.access_token, vence: Date.now() + (j.expires_in ?? 3600) * 1000 };
  return j.access_token;
}

async function llamar<T>(url: string, cuerpo: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const j = (await res.json().catch(() => ({}))) as T & { error?: { message?: string; status?: string } };
  if (!res.ok) {
    const msg = j.error?.message ?? `HTTP ${res.status}`;
    // Los dos fallos de siempre, en palabras que dicen qué hacer
    if (res.status === 403) throw new Error(`Google no deja entrar: agrega el correo del robot como usuario de esta propiedad (${msg})`);
    if (res.status === 404) throw new Error(`Google no encuentra esa propiedad: revisa cómo está escrita (${msg})`);
    throw new Error(msg);
  }
  return j;
}

/** aaaa-mm-dd de hace N días, en hora del Este (la de la empresa). */
function diasAtras(n: number): string {
  const d = new Date(Date.now() - n * 86_400_000);
  return d.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

type FilaGsc = { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number };

/** Arma el resumen a partir de las filas crudas. Exportada para probarla sin Google. */
export function resumirGsc(
  propiedad: string,
  rango: { desde: string; hasta: string },
  totalAhora: FilaGsc | undefined,
  totalAntes: FilaGsc | undefined,
  consultas: FilaGsc[]
): ResumenGsc {
  return {
    propiedad,
    desde: rango.desde,
    hasta: rango.hasta,
    clics: Math.round(totalAhora?.clicks ?? 0),
    impresiones: Math.round(totalAhora?.impressions ?? 0),
    ctr: totalAhora?.ctr ?? 0,
    posicion: totalAhora?.position ?? 0,
    clicsAntes: Math.round(totalAntes?.clicks ?? 0),
    impresionesAntes: Math.round(totalAntes?.impressions ?? 0),
    consultas: consultas.map((r) => ({
      consulta: r.keys?.[0] ?? "",
      clics: Math.round(r.clicks),
      impresiones: Math.round(r.impressions),
      posicion: Math.round(r.position * 10) / 10,
    })),
  };
}

export async function consultarSearchConsole(propiedad: string): Promise<ResumenGsc> {
  // Search Console publica con dos o tres días de retraso: se corta antes.
  const hasta = diasAtras(3);
  const desde = diasAtras(30);
  const antesHasta = diasAtras(31);
  const antesDesde = diasAtras(58);
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(propiedad)}/searchAnalytics/query`;
  type R = { rows?: FilaGsc[] };
  const [ahora, antes, porConsulta] = await Promise.all([
    llamar<R>(url, { startDate: desde, endDate: hasta }),
    llamar<R>(url, { startDate: antesDesde, endDate: antesHasta }),
    llamar<R>(url, { startDate: desde, endDate: hasta, dimensions: ["query"], rowLimit: 5 }),
  ]);
  return resumirGsc(propiedad, { desde, hasta }, ahora.rows?.[0], antes.rows?.[0], porConsulta.rows ?? []);
}

type ReporteGa4 = {
  rows?: { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }[];
};

/** Arma el resumen de Analytics. Exportada para probarla sin Google. */
export function resumirGa4(propiedad: string, totales: ReporteGa4, paginas: ReporteGa4): ResumenGa4 {
  // Con dos rangos de fechas y sin dimensiones, GA4 devuelve una fila por
  // rango, marcada como date_range_0 (ahora) y date_range_1 (antes).
  const fila = (nombre: string) =>
    (totales.rows ?? []).find((r) => (r.dimensionValues?.[0]?.value ?? "date_range_0") === nombre)?.metricValues ?? [];
  const n = (v: { value: string } | undefined) => Math.round(Number(v?.value ?? 0));
  const ahora = fila("date_range_0");
  const antes = fila("date_range_1");
  return {
    propiedad,
    usuarios: n(ahora[0]),
    sesiones: n(ahora[1]),
    vistas: n(ahora[2]),
    usuariosAntes: n(antes[0]),
    sesionesAntes: n(antes[1]),
    paginas: (paginas.rows ?? []).map((r) => ({
      ruta: r.dimensionValues?.[0]?.value ?? "/",
      vistas: n(r.metricValues?.[0]),
    })),
  };
}

export async function consultarAnalytics(propertyId: string): Promise<ResumenGa4> {
  const id = propertyId.replace(/^properties\//, "").trim();
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(id)}:runReport`;
  const [totales, paginas] = await Promise.all([
    llamar<ReporteGa4>(url, {
      dateRanges: [
        { startDate: "28daysAgo", endDate: "yesterday" },
        { startDate: "56daysAgo", endDate: "29daysAgo" },
      ],
      metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "screenPageViews" }],
    }),
    llamar<ReporteGa4>(url, {
      dateRanges: [{ startDate: "28daysAgo", endDate: "yesterday" }],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 5,
    }),
  ]);
  return resumirGa4(id, totales, paginas);
}

// Google tarda uno o dos segundos por propiedad y el Resumen pregunta por
// todos los websites a la vez: se guarda un rato para no volver a pedirlo en
// cada clic. Vive en la memoria de la función de Vercel; si se reinicia, se
// vuelve a pedir y ya.
const GUARDADO_MS = 15 * 60 * 1000;
const guardado = new Map<string, { en: number; datos: GoogleDeSitio }>();

export async function googleDeSitio(
  siteId: string,
  gsc: string | null,
  ga4: string | null,
  forzar = false
): Promise<GoogleDeSitio> {
  const clave = `${siteId}|${gsc ?? ""}|${ga4 ?? ""}`;
  const previo = guardado.get(clave);
  if (!forzar && previo && Date.now() - previo.en < GUARDADO_MS) return previo.datos;

  const faltas: string[] = [];
  let rGsc: ResumenGsc | null = null;
  let rGa4: ResumenGa4 | null = null;

  if (!credenciales()) {
    faltas.push("Falta GOOGLE_SERVICE_ACCOUNT_JSON en Vercel: el portal no tiene con qué entrar a Google.");
  } else {
    const [a, b] = await Promise.allSettled([
      gsc?.trim() ? consultarSearchConsole(gsc.trim()) : Promise.reject(new Error("sin propiedad")),
      ga4?.trim() ? consultarAnalytics(ga4) : Promise.reject(new Error("sin propiedad")),
    ]);
    if (a.status === "fulfilled") rGsc = a.value;
    else faltas.push(gsc?.trim() ? `Search Console: ${a.reason?.message ?? a.reason}` : "Search Console: falta la propiedad en Expediente › Medición.");
    if (b.status === "fulfilled") rGa4 = b.value;
    else faltas.push(ga4?.trim() ? `Analytics: ${b.reason?.message ?? b.reason}` : "Analytics: falta el ID de propiedad en Expediente › Medición.");
  }

  const datos: GoogleDeSitio = { gsc: rGsc, ga4: rGa4, faltas, tomado: new Date().toISOString() };
  // Solo se guarda lo que salió bien: un fallo se reintenta al siguiente clic
  if (rGsc || rGa4) guardado.set(clave, { en: Date.now(), datos });
  return datos;
}
