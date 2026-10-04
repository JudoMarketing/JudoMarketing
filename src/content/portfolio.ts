/**
 * Catálogo de categorías del portafolio y armado de la captura de cada sitio.
 *
 * Los trabajos ya no viven aquí: salen de la lista de websites del portal de
 * admin. Lo que Administración da de alta aparece, y lo que deshabilita
 * desaparece.
 */

export type Categoria =
  | "food"
  | "delivery"
  | "tiendas"
  | "servicios"
  | "fundaciones"
  | "equipos"
  | "educacion"
  | "automotriz"
  | "construccion";

export type Trabajo = {
  nombre: string;
  dominio: string;
  url: string;
  imagen: string;
  categoria: Categoria | null;
  /** Un borrador se puede mostrar, pero se avisa que todavía no está entregado. */
  enDesarrollo: boolean;
  descripcion: { es: string; en: string };
  /** Video de portada, si el sitio tiene uno grabado (VIDEOS_PORTADA). */
  video: { src: string; poster: string } | null;
};

/**
 * Sitios con video de portada (Junior, 4 de octubre de 2026): la entrada del
 * hero y un recorrido suave hacia abajo, unos 5 segundos en bucle. Los graba
 * scripts/showcase/grabar-videos.mjs en public/showcase/video/. Va el dominio
 * tal como está en el portal, sin www; el que no está aquí sigue con su foto.
 * Si está aquí, el video manda aunque el portal tenga una imagen propia.
 * Si un sitio cambia mucho de diseño, se vuelve a grabar (docs/SHOWCASE-VIDEO.md).
 */
export const VIDEOS_PORTADA: string[] = [
  "dameunamano.org",
  "denalibehaviorcrt.com",
  "johanmorenotailor.com",
  "judomarketing.github.io/GeraldMarket",
  "melanieosorio.com",
  "pachy-pinchos.vercel.app",
  "paradiseranch22.com",
  "art-foundation.vercel.app",
  "zanoah.shop",
  "thenotes.net",
  "the-equipment-source.vercel.app",
  "deliveryrushflorida.com",
  "judimental.com",
];

export function videoDePortada(dominio: string): Trabajo["video"] {
  const limpio = dominio.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");
  if (!VIDEOS_PORTADA.includes(limpio)) return null;
  const slug = limpio.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
  return { src: `/showcase/video/${slug}.mp4`, poster: `/showcase/video/${slug}.jpg` };
}

/**
 * Portadas fijas elegidas por Junior para sitios sin movimiento: van en vez
 * de la captura automática (y de la imagen del portal). Archivos en
 * public/showcase/portadas/, a 1200x750 para que calcen con la ficha.
 */
const PORTADAS_FIJAS: Record<string, string> = {
  // Vanventure, 4 de octubre de 2026: su arte de "Private van tours in Miami"
  "vanventuremia.com": "/showcase/portadas/vanventuremia-com.jpg",
};

export function portadaFija(dominio: string): string | null {
  const limpio = dominio.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");
  return PORTADAS_FIJAS[limpio] ?? null;
}

// Misma lista que el selector del portal y que el candado de la base
// (migración 0023). Si se agrega una categoría, va en las cuatro.
export const CATEGORIAS: { id: Categoria; es: string; en: string }[] = [
  { id: "food", es: "Comida y restaurantes", en: "Food & Restaurants" },
  { id: "delivery", es: "Mobile apps", en: "Mobile apps" },
  { id: "tiendas", es: "Tiendas online", en: "Online stores" },
  { id: "servicios", es: "Servicios", en: "Services" },
  { id: "fundaciones", es: "Fundaciones y ONG", en: "Nonprofits" },
  { id: "equipos", es: "Equipos e industria", en: "Equipment & industrial" },
  { id: "educacion", es: "Educación y cursos", en: "Education & courses" },
  { id: "automotriz", es: "Automotriz", en: "Automotive" },
  { id: "construccion", es: "Construcción", en: "Construction" },
];

/**
 * Captura del home. Se genera sola a partir del dominio, así que un website
 * nuevo ya trae su imagen sin que nadie suba nada. Si algún día hace falta
 * una imagen distinta, se guarda en el campo portfolio_image y esa manda.
 *
 * El servicio dibuja la página en una pantalla de 1200 de ancho y después la
 * achica a los 900 que pedimos, así que el recorte también se achica: pedir
 * crop/750 devuelve una imagen de 900x562. Ese número no es decorativo: tiene
 * que dar la misma proporción que la ficha del showcase (RELACION_CAPTURA),
 * porque si no coinciden el navegador agranda la captura para llenar el hueco
 * y se come los bordes del sitio.
 */
const ANCHO_CAPTURA = 900;
const RECORTE_CAPTURA = 750; // 750 x 0.75 = 562 de alto
/** La misma proporción, para la ficha que muestra la captura. */
export const RELACION_CAPTURA = "900/562";

/**
 * Segundos de espera antes de disparar la foto. Sin esto, un sitio pesado
 * todavía está pintando cuando el servicio dispara y sale una portada en
 * blanco. Y esa portada en blanco se queda guardada un día entero, así que la
 * espera sale más barata que el error.
 */
const ESPERA_CAPTURA = 8;

/**
 * Captura del home.
 *
 * `sello` sirve para volver a tomarla. El servicio guarda cada captura por 24
 * horas contra la dirección exacta que se le pidió, buena o mala: si salió en
 * blanco, pedir lo mismo devuelve el blanco. Cambiar el sello cambia la
 * dirección y obliga a una foto nueva. Se llena desde el portal con el botón
 * "Actualizar portada".
 *
 * Ojo con la primera vez que se pide una dirección nueva: el servicio contesta
 * con un dibujo de "cargando" mientras saca la foto de verdad, y la entrega en
 * la siguiente visita. Por eso el botón avisa que hay que esperar un momento.
 */
export function capturaDelHome(
  dominio: string,
  propia?: string | null,
  sello?: string | null
): string {
  if (propia?.trim()) return propia.trim();
  const limpio = dominio.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const marca = sello ? `?jm=${Date.parse(sello) || 0}` : "";
  return `https://image.thum.io/get/width/${ANCHO_CAPTURA}/crop/${RECORTE_CAPTURA}/wait/${ESPERA_CAPTURA}/https://${limpio}${marca}`;
}
