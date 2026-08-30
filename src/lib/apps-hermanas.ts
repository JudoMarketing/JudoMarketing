// Cómo se le habla a cada app hermana desde el servidor.
//
// Solo servidor: aquí se leen los secretos compartidos. Si esto llegara al
// navegador, cualquiera con la consola abierta podría darse a sí mismo una
// silla gratis en las tres apps.

import { APPS_INVITADO, type AppInvitado } from "@/content/apps-hermanas";

type Config = {
  /** Origen del deploy + el prefijo bajo el que vive su API. */
  base: string;
  secreto: string;
};

/**
 * JuditoADS y Juditos se sirven bajo un prefijo de judomarketing.net
 * (`/juditoads`, `/juditos`), así que su API cuelga de ahí. JudiMental es una
 * app de teléfono: su backend no tiene prefijo.
 */
const RUTAS: Record<AppInvitado, { url: string; token: string; prefijo: string }> = {
  juditoads: { url: "JUDITOADS_URL", token: "JUDITOADS_ADMIN_TOKEN", prefijo: "/juditoads" },
  juditos: { url: "JUDITOS_URL", token: "JUDITOS_ADMIN_TOKEN", prefijo: "/juditos" },
  judimental: { url: "JUDIMENTAL_URL", token: "JUDIMENTAL_ADMIN_TOKEN", prefijo: "" },
};

/**
 * La configuración de una app, o el texto que explica qué falta. Devolver el
 * texto en vez de lanzar deja que el portal muestre "falta la variable X"
 * en lugar de un 500 sin pistas.
 */
export function configDe(app: AppInvitado): Config | { falta: string } {
  const r = RUTAS[app];
  const nombre = APPS_INVITADO.find((a) => a.key === app)?.nombre ?? app;

  const origin = process.env[r.url];
  if (!origin) return { falta: `Falta ${r.url} en las variables de entorno: ${nombre} todavía no está conectada.` };

  const secreto = process.env[r.token];
  if (!secreto) return { falta: `Falta ${r.token} en las variables de entorno.` };

  return { base: `${origin.replace(/\/$/, "")}${r.prefijo}`, secreto };
}

export type RespuestaHermana = { ok: true; cuerpo: unknown } | { ok: false; error: string };

/**
 * Le habla a una app hermana con el secreto compartido.
 *
 * Traduce sus fallos a algo que se pueda leer en el portal. El caso 404/405
 * tiene texto propio a propósito: significa que la app existe pero todavía no
 * implementó ese endpoint, que es exactamente lo que pasó con las acciones de
 * JuditoADS — los botones estuvieron listos días antes que el otro extremo.
 */
export async function hablarCon(
  app: AppInvitado,
  ruta: string,
  init: RequestInit = {}
): Promise<RespuestaHermana> {
  const cfg = configDe(app);
  if ("falta" in cfg) return { ok: false, error: cfg.falta };

  const nombre = APPS_INVITADO.find((a) => a.key === app)?.nombre ?? app;

  try {
    const res = await fetch(`${cfg.base}${ruta}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${cfg.secreto}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(init.headers ?? {}),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    const cuerpo = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      return {
        ok: false,
        error:
          cuerpo.error ??
          (res.status === 404 || res.status === 405
            ? `${nombre} todavía no acepta esta orden: falta implementarla en su app.`
            : `${nombre} respondió ${res.status}`),
      };
    }
    return { ok: true, cuerpo };
  } catch {
    return { ok: false, error: `No se pudo contactar a ${nombre}.` };
  }
}
