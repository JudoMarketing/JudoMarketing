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
  "godshome.app",
  "hr-gutters.vercel.app",
  "nvlabs.vercel.app",
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

/**
 * Proyectos que se enseñan sin estar en la lista de websites del portal: allá
 * cada sitio lleva cliente y cobro, y estos no. Salen primero en el showcase,
 * con su video o su captura como cualquier otro. Si algún día se dan de alta
 * en el portal con el mismo dominio, manda la ficha del portal.
 */
export const PROYECTOS_FIJOS: {
  nombre: string;
  dominio: string;
  url: string;
  categoria: Categoria;
  descripcion: { es: string; en: string };
}[] = [
  // Junior, 12 de octubre de 2026
  {
    nombre: "God's Home",
    dominio: "godshome.app",
    url: "https://www.godshome.app",
    categoria: "delivery",
    descripcion: {
      es: "App de teléfono: eliges cómo te sientes y recibes un mensaje de Dios basado en la Biblia.",
      en: "Phone app: choose how you feel and receive a message from God based on the Bible.",
    },
  },
  // Junior, 11 de noviembre de 2026
  {
    nombre: "HR Gutters",
    dominio: "hr-gutters.vercel.app",
    url: "https://hr-gutters.vercel.app",
    categoria: "construccion",
    descripcion: {
      es: "Canaletas sin costuras, protectores, fascia y sofito en Orlando y el centro de Florida. Equipo bilingüe: el cliente llama, escribe por WhatsApp o agenda su estimado gratis en línea en dos minutos.",
      en: "Seamless gutters, gutter guards, fascia and soffit in Orlando and Central Florida. A bilingual crew: homeowners call, text on WhatsApp or book a free estimate online in two minutes.",
    },
  },
  {
    nombre: "NV Labs",
    dominio: "nvlabs.vercel.app",
    url: "https://nvlabs.vercel.app",
    categoria: "equipos",
    descripcion: {
      es: "Fabricante de vitaminas y suplementos de marca propia en Miami-Dade, con seis formas de dosis bajo cGMP. La marca manda su fórmula y recibe cotización en 48 horas, muestras gratis y su etiqueta lista.",
      en: "Private label vitamin and supplement manufacturer in Miami-Dade, with six dosage forms under cGMP. A brand sends its formula and gets a quote in 48 hours, free samples and a ready label.",
    },
  },
];

/**
 * Descripciones escritas por Judo (Junior, 11 de noviembre de 2026: "ve qué
 * hacen y cómo lo hacen"). Llenan la ficha cuando el portal no trae texto; si
 * Administración escribe una en el portal, manda la del portal. Va el dominio
 * sin www, tal como está en el portal.
 */
export const DESCRIPCIONES_SHOWCASE: Record<string, { es: string; en: string }> = {
  "pachy-pinchos.vercel.app": {
    es: "Pinchos boricuas hechos al momento en St. Cloud, Florida. Se ordena en la misma web, sin apps de terceros: escoges del menú, eliges pickup o delivery (gratis desde $30) y la orden llega directo a la cocina.",
    en: "Puerto Rican pinchos made to order in St. Cloud, Florida. Customers order right on the site, with no third-party apps: pick from the menu, choose pickup or delivery (free over $30), and the order goes straight to the kitchen.",
  },
  "the-equipment-source.vercel.app": {
    es: "Renta y venta de equipo de construcción en el suroeste de Florida y la costa del Golfo. El contratista busca por categoría y patio, ve qué máquina está lista esta semana con tarifas por día, semana y mes, y arma su cotización.",
    en: "Construction equipment rentals and sales across Southwest Florida and the Gulf Coast. Contractors search by category and yard, see which machines are ready this week with day, week and month rates, and build a quote.",
  },
  "art-foundation.vercel.app": {
    es: "Clases de arte, teatro y guitarra en Miami, cada sábado, para alumnos con y sin discapacidad. Las familias escogen sus clases y se inscriben en línea; el apoyo uno a uno es gratis y la segunda clase va a mitad de precio.",
    en: "Art, theatre and guitar classes in Miami every Saturday, for students with and without disabilities. Families pick their classes and register online; one-on-one support is free and a second class is half price.",
  },
};

/**
 * Dirección pública de un sitio que en el portal sigue con su dirección de
 * Vercel. La ficha abre la dirección real (Junior, 11 de noviembre de 2026:
 * "conecta Pachy Pinchos"); el video y la foto se siguen buscando con la del
 * portal. Va el dominio sin www.
 */
export const DOMINIO_PUBLICO: Record<string, string> = {
  "pachy-pinchos.vercel.app": "pachypinchos.com",
};

/**
 * Orden del showcase (Junior, 22 de octubre de 2026): estos van primero, en
 * este orden. El resto sigue detrás en el orden de siempre (los fijos y
 * después lo más nuevo del portal). Va el dominio sin www.
 */
export const ORDEN_SHOWCASE: string[] = [
  "godshome.app",
  "the-equipment-source.vercel.app",
  "deliveryrushflorida.com",
  "johanmorenotailor.com",
  "vanventuremia.com",
  "dameunamano.org",
];

/**
 * Sitios que no salen en el showcase aunque el portal los tenga visibles
 * (Junior, 28 de octubre de 2026): solo existen en español y el showcase se
 * enseña en inglés. Melanie también es solo en español, pero se queda.
 * Va el dominio sin www; tapa también cualquier ruta debajo de él.
 */
export const OCULTOS_SHOWCASE: string[] = [
  "judomarketing.github.io/GeraldMarket",
  "milcoloresapp.vercel.app",
];

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
