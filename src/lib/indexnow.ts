/**
 * IndexNow: el aviso directo a los buscadores que no son Google.
 *
 * Bing lo consume, y con Bing van Yahoo, DuckDuckGo y Ecosia, que usan su
 * índice. Yandex y Seznam también. Es el único camino para entrar rápido en
 * todos ellos sin abrir una cuenta en cada uno.
 *
 * La clave vive en un archivo de texto público (public/<clave>.txt): así el
 * buscador comprueba que quien avisa es el dueño del dominio.
 */

export const INDEXNOW_KEY = "dfedda8677e67475e70d45f68546b564";
export const SITIO = "www.judomarketing.net";

/** Todas las direcciones públicas, las mismas que el mapa del sitio. */
export function urlsPublicas(): string[] {
  const base = `https://${SITIO}`;
  const rutas = [
    "/", "/services", "/showcase", "/about", "/contact", "/legal",
    "/es", "/es/servicios", "/es/showcase", "/es/nosotros", "/es/contacto", "/es/legal",
  ];
  return rutas.map((r) => `${base}${r}`);
}

export type ResultadoAviso = { motor: string; estado: number | string };

/**
 * Avisa a los buscadores que hay contenido nuevo. Un 200 o 202 significa
 * recibido; el buscador decide cuándo pasa a mirar.
 */
export async function avisarBuscadores(
  urls: string[] = urlsPublicas()
): Promise<ResultadoAviso[]> {
  const cuerpo = JSON.stringify({
    host: SITIO,
    key: INDEXNOW_KEY,
    keyLocation: `https://${SITIO}/${INDEXNOW_KEY}.txt`,
    urlList: urls,
  });

  const motores = [
    ["IndexNow", "https://api.indexnow.org/indexnow"],
    ["Bing", "https://www.bing.com/indexnow"],
    ["Yandex", "https://yandex.com/indexnow"],
  ] as const;

  return Promise.all(
    motores.map(async ([motor, endpoint]) => {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: cuerpo,
        });
        return { motor, estado: res.status };
      } catch (e) {
        return { motor, estado: e instanceof Error ? e.message : "error" };
      }
    })
  );
}
