/**
 * El landing de promoción de JudiMental (judomarketing.net/judimental).
 *
 * Privado a propósito: no está enlazado desde ningún sitio, lleva noindex y
 * robots.txt lo excluye. Solo lo ve quien tenga el enlace (un anuncio, un
 * QR, un mensaje). Fondo negro puro y tres botones, cada uno con su imagen
 * encima, en este orden.
 *
 * Las imágenes van en public/judimental/ con los nombres 1, 2 y 3. Los
 * textos y destinos de los botones se cambian aquí.
 */

export const JUDIMENTAL_URL = "https://www.judimental.com";

export type BotonPromo = {
  /** Ruta pública de la imagen que va encima del botón. */
  imagen: string;
  /** Texto del botón. */
  texto: string;
  /** A dónde lleva. */
  href: string;
};

export const BOTONES_PROMO: BotonPromo[] = [
  { imagen: "/judimental/1.png", texto: "Conoce JudiMental", href: JUDIMENTAL_URL },
  { imagen: "/judimental/2.png", texto: "Empieza gratis", href: JUDIMENTAL_URL },
  { imagen: "/judimental/3.png", texto: "Descarga la app", href: JUDIMENTAL_URL },
];
