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

const SCOPE = "https://www.googleapis.com/auth/calendar.events";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

export function googleCalendarConfigurado(): boolean {
  return Boolean(
    process.env.GOOGLE_SA_EMAIL &&
      process.env.GOOGLE_SA_PRIVATE_KEY &&
      process.env.GOOGLE_CALENDAR_USER
  );
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
  const llave = process.env.GOOGLE_SA_PRIVATE_KEY!.replace(/\\n/g, "\n");
  pistas.llave = {
    empiezaBien: llave.trimStart().startsWith("-----BEGIN"),
    terminaBien: llave.trimEnd().endsWith("PRIVATE KEY-----"),
    tieneSaltos: llave.includes("\n"),
    largo: llave.length,
  };
  pistas.usuario = process.env.GOOGLE_CALENDAR_USER!.split("@")[1] ?? null;

  try {
    const token = await pedirToken(true);
    if (typeof token !== "string") {
      return { ...pistas, paso: "token", error: token };
    }

    // Con el token en mano, probamos leer el calendario. Es la prueba más
    // barata de que la delegación quedó bien hecha.
    const calendario = encodeURIComponent(
      process.env.GOOGLE_CALENDAR_ID?.trim() || "primary"
    );
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendario}`,
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
  detallado = false
): Promise<string | { estado: number; error: string } | null> {
  const email = process.env.GOOGLE_SA_EMAIL!;
  const usuario = process.env.GOOGLE_CALENDAR_USER!;
  // En Vercel la llave se pega con \n escritos como texto.
  const llave = process.env.GOOGLE_SA_PRIVATE_KEY!.replace(/\\n/g, "\n");

  const ahora = Math.floor(Date.now() / 1000);
  const cabecera = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const cuerpo = base64Url(
    JSON.stringify({
      iss: email,
      sub: usuario, // actuamos en nombre de esta cuenta del Workspace
      scope: SCOPE,
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
