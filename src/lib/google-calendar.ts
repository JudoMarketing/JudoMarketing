import { createSign } from "crypto";

/**
 * Crea la cita directamente en Google Calendar, con su propio enlace de
 * Google Meet, y deja que Google mande las invitaciones a los invitados.
 *
 * Usa una cuenta de servicio con delegación en el Workspace de
 * judomarketing.net, así que no hay que volver a autorizar nada nunca.
 * Variables en Vercel:
 *   GOOGLE_SA_EMAIL        correo de la cuenta de servicio
 *   GOOGLE_SA_PRIVATE_KEY  la private_key del JSON que descarga Google
 *   GOOGLE_CALENDAR_USER   a nombre de quién se crea (admin@judomarketing.net)
 *   GOOGLE_CALENDAR_ID     opcional, por defecto el calendario principal
 *
 * Si falta cualquiera de las tres primeras, esto se apaga solo y el sistema
 * sigue funcionando con la invitación por correo.
 */

const SCOPE_EVENTOS = "https://www.googleapis.com/auth/calendar.events";
// Permiso mínimo: solo dice "ocupado de tal hora a tal hora", nunca de qué.
const SCOPE_OCUPACION = "https://www.googleapis.com/auth/calendar.freebusy";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

export function googleCalendarConfigurado(): boolean {
  return Boolean(
    process.env.GOOGLE_SA_EMAIL &&
      process.env.GOOGLE_SA_PRIVATE_KEY &&
      process.env.GOOGLE_CALENDAR_USER
  );
}

/**
 * Deja la llave privada en el formato que Node necesita, sin importar cómo se
 * haya copiado del archivo JSON de Google. Acepta:
 *   · la llave sola
 *   · la llave con las comillas alrededor
 *   · la línea completa   "private_key": "-----BEGIN…"
 *   · el archivo JSON entero
 *   · cualquiera de las anteriores en base64
 */
export function normalizarLlave(crudo: string): string {
  let valor = crudo.trim();

  // ¿Vino el JSON completo, o en base64?
  const desdeJson = (texto: string): string | null => {
    try {
      const obj = JSON.parse(texto) as { private_key?: string };
      return typeof obj.private_key === "string" ? obj.private_key : null;
    } catch {
      return null;
    }
  };

  if (valor.startsWith("{")) {
    valor = desdeJson(valor) ?? valor;
  } else if (/^[A-Za-z0-9+/=\s]+$/.test(valor) && valor.length > 200) {
    try {
      const abierto = Buffer.from(valor, "base64").toString("utf8");
      if (abierto.includes("BEGIN") || abierto.trimStart().startsWith("{")) {
        valor = desdeJson(abierto) ?? abierto;
      }
    } catch {
      /* no era base64: seguimos con lo que había */
    }
  }

  // Etiqueta del campo pegada por delante:  "private_key": "-----BEGIN…
  valor = valor.replace(/^["']?private_key["']?\s*:\s*/i, "").trim();
  // Comillas alrededor, y una coma final si venía de una línea del JSON
  valor = valor.replace(/,\s*$/, "").trim();
  valor = valor.replace(/^["']|["']$/g, "").trim();
  // Los \n escritos como texto
  valor = valor.replace(/\\n/g, "\n").trim();

  return valor;
}

/** Qué forma traía la llave, sin revelar nada de su contenido. */
export function formaDeLlave(crudo: string) {
  const limpia = normalizarLlave(crudo);
  return {
    crudoEmpiezaConLlaveJson: crudo.trimStart().startsWith("{"),
    crudoEmpiezaConComilla: /^["']/.test(crudo.trim()),
    crudoEmpiezaConEtiqueta: /^["']?private_key/i.test(crudo.trim()),
    empiezaBien: limpia.startsWith("-----BEGIN"),
    terminaBien: limpia.endsWith("PRIVATE KEY-----"),
    tieneSaltos: limpia.includes("\n"),
    lineas: limpia.split("\n").length,
    largo: limpia.length,
  };
}

function base64Url(dato: string | Buffer): string {
  return Buffer.from(dato)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Tapa correos, llaves y tokens antes de mostrar un mensaje de Google. */
function censurar(texto: string): string {
  return texto
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "«correo»")
    .replace(/[A-Za-z0-9_-]{40,}/g, "«token»")
    .slice(0, 500);
}

/**
 * Revisa paso por paso dónde se rompe la conexión con Google, sin exponer
 * ningún secreto. Lo usa /api/booking/diagnostico.
 */
export async function diagnosticarGoogle() {
  const variables = {
    GOOGLE_SA_EMAIL: Boolean(process.env.GOOGLE_SA_EMAIL),
    GOOGLE_SA_PRIVATE_KEY: Boolean(process.env.GOOGLE_SA_PRIVATE_KEY),
    GOOGLE_CALENDAR_USER: Boolean(process.env.GOOGLE_CALENDAR_USER),
  };

  const pistas: Record<string, unknown> = { variables };

  if (!googleCalendarConfigurado()) {
    return {
      ...pistas,
      paso: "faltan_variables",
      mensaje:
        "Alguna variable no llegó al despliegue. Revisa que estén en Production y vuelve a desplegar.",
    };
  }

  // La llave privada tiene que verse como una llave, no como un pedazo suelto.
  pistas.llave = formaDeLlave(process.env.GOOGLE_SA_PRIVATE_KEY!);
  pistas.usuario = process.env.GOOGLE_CALENDAR_USER!.split("@")[1] ?? null;
  pistas.cuentaDeServicio = process.env
    .GOOGLE_SA_EMAIL!.trim()
    .replace(/^["']|["']$/g, "")
    .endsWith(".iam.gserviceaccount.com");

  try {
    const token = await pedirToken(true);
    if (typeof token !== "string") {
      return { ...pistas, paso: "token", error: token };
    }

    // Con el token en mano probamos leer los eventos, que es justo lo que
    // cubre el permiso calendar.events. Pedir los datos del calendario en sí
    // exigiría un permiso más amplio y daría un 403 engañoso.
    const calendario = encodeURIComponent(
      process.env.GOOGLE_CALENDAR_ID?.trim() || "primary"
    );
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendario}/events?maxResults=1`,
      { headers: { authorization: `Bearer ${token}` } }
    );
    if (!res.ok) {
      return {
        ...pistas,
        paso: "calendario",
        estado: res.status,
        error: censurar(await res.text()),
      };
    }
    return { ...pistas, paso: "listo", mensaje: "Google responde correctamente." };
  } catch (fallo) {
    return { ...pistas, paso: "excepcion", error: censurar(String(fallo)) };
  }
}

/** Cambia la cuenta de servicio por un token de acceso de Google. */
async function pedirToken(
  detallado = false,
  scope: string = SCOPE_EVENTOS
): Promise<string | { estado: number; error: string } | null> {
  const email = process.env.GOOGLE_SA_EMAIL!.trim().replace(/^["']|["']$/g, "");
  const usuario = process.env
    .GOOGLE_CALENDAR_USER!.trim()
    .replace(/^["']|["']$/g, "");
  const llave = normalizarLlave(process.env.GOOGLE_SA_PRIVATE_KEY!);

  const ahora = Math.floor(Date.now() / 1000);
  const cabecera = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const cuerpo = base64Url(
    JSON.stringify({
      iss: email,
      sub: usuario, // actuamos en nombre de esta cuenta del Workspace
      scope,
      aud: TOKEN_URL,
      iat: ahora,
      exp: ahora + 3600,
    })
  );

  const firma = createSign("RSA-SHA256")
    .update(`${cabecera}.${cuerpo}`)
    .sign(llave);
  const jwt = `${cabecera}.${cuerpo}.${base64Url(firma)}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const detalle = await res.text();
    console.error("Google no dio token:", detalle);
    return detallado ? { estado: res.status, error: censurar(detalle) } : null;
  }
  const data = (await res.json()) as { access_token?: string };
  return data.access_token ?? null;
}

export type Ocupado = { inicio: Date; fin: Date };

// La agenda no cambia cada segundo: guardamos la respuesta un ratito para no
// preguntarle a Google en cada visita al calendario.
const cacheOcupados = new Map<string, { hasta: number; datos: Ocupado[] }>();
const VIDA_CACHE = 60_000;

/**
 * Bloques ocupados de las agendas indicadas, según Google.
 *
 * Usa el permiso freebusy, que solo devuelve horarios: nunca el título ni los
 * invitados de un evento. Si el permiso no está autorizado, si un calendario
 * no está compartido, o si Google falla, devuelve lo que haya podido leer (o
 * nada) sin romper el sistema de citas.
 */
export async function horariosOcupados(
  desde: Date,
  hasta: Date,
  calendarios: string[]
): Promise<Ocupado[]> {
  if (!googleCalendarConfigurado() || calendarios.length === 0) return [];

  const llaveCache = `${desde.toISOString()}|${hasta.toISOString()}|${calendarios.join(",")}`;
  const guardado = cacheOcupados.get(llaveCache);
  if (guardado && guardado.hasta > Date.now()) return guardado.datos;

  try {
    const token = await pedirToken(false, SCOPE_OCUPACION);
    if (typeof token !== "string") return [];

    const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        timeMin: desde.toISOString(),
        timeMax: hasta.toISOString(),
        items: calendarios.map((id) => ({ id })),
      }),
    });

    if (!res.ok) {
      console.error("freeBusy falló:", await res.text());
      return [];
    }

    const data = (await res.json()) as {
      calendars?: Record<
        string,
        { busy?: { start: string; end: string }[]; errors?: unknown[] }
      >;
    };

    const bloques: Ocupado[] = [];
    for (const agenda of Object.values(data.calendars ?? {})) {
      // Un calendario que no esté compartido viene con errores: lo saltamos y
      // seguimos con los demás.
      for (const rato of agenda.busy ?? []) {
        const inicio = new Date(rato.start);
        const fin = new Date(rato.end);
        if (!Number.isNaN(inicio.getTime()) && !Number.isNaN(fin.getTime())) {
          bloques.push({ inicio, fin });
        }
      }
    }

    cacheOcupados.set(llaveCache, {
      hasta: Date.now() + VIDA_CACHE,
      datos: bloques,
    });
    return bloques;
  } catch (fallo) {
    console.error("No se pudo leer la agenda:", fallo);
    return [];
  }
}

export type CitaGoogle = {
  enlaceMeet: string | null;
  enlaceEvento: string | null;
};

/**
 * Agenda el evento y devuelve el enlace de Meet. Si algo falla devuelve null
 * para que quien llama use el plan B (la invitación por correo).
 */
export async function crearCitaEnGoogle({
  id,
  inicio,
  fin,
  titulo,
  descripcion,
  zonaHoraria,
  invitados,
}: {
  id: string;
  inicio: Date;
  fin: Date;
  titulo: string;
  descripcion: string;
  zonaHoraria: string;
  invitados: string[];
}): Promise<CitaGoogle | null> {
  if (!googleCalendarConfigurado()) return null;

  try {
    const token = await pedirToken();
    if (typeof token !== "string") return null;

    const calendario = encodeURIComponent(
      process.env.GOOGLE_CALENDAR_ID?.trim() || "primary"
    );

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendario}/events` +
        `?conferenceDataVersion=1&sendUpdates=all`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          summary: titulo,
          description: descripcion,
          start: { dateTime: inicio.toISOString(), timeZone: zonaHoraria },
          end: { dateTime: fin.toISOString(), timeZone: zonaHoraria },
          attendees: invitados.map((email) => ({ email })),
          guestsCanModify: false,
          reminders: {
            useDefault: false,
            overrides: [
              { method: "popup", minutes: 30 },
              { method: "email", minutes: 60 },
            ],
          },
          conferenceData: {
            createRequest: {
              requestId: id,
              conferenceSolutionKey: { type: "hangoutsMeet" },
            },
          },
        }),
      }
    );

    if (!res.ok) {
      console.error("Google no creó la cita:", await res.text());
      return null;
    }

    const evento = (await res.json()) as {
      hangoutLink?: string;
      htmlLink?: string;
      conferenceData?: { entryPoints?: { uri?: string; entryPointType?: string }[] };
    };

    const porEntrada = evento.conferenceData?.entryPoints?.find(
      (e) => e.entryPointType === "video"
    )?.uri;

    return {
      enlaceMeet: evento.hangoutLink ?? porEntrada ?? null,
      enlaceEvento: evento.htmlLink ?? null,
    };
  } catch (fallo) {
    console.error("Google Calendar falló:", fallo);
    return null;
  }
}
