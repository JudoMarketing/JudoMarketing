/**
 * El landing de promoción de JudiMental (judomarketing.net/judimental).
 *
 * Privado a propósito: no está enlazado desde ningún sitio, lleva noindex y
 * robots.txt lo excluye. Solo lo ve quien tenga el enlace (un anuncio, un
 * QR, un mensaje). Fondo negro puro y tres botones, en este orden. Las
 * imágenes SON los botones (vienen dibujadas con su texto): cada una es un
 * enlace. Viven en public/judimental/1.png, 2.png y 3.png.
 */

export type BotonPromo = {
  /** Ruta pública de la imagen-botón. */
  imagen: string;
  /** Qué es, para lectores de pantalla. */
  alt: string;
  /** A dónde lleva. */
  href: string;
};

export const BOTONES_PROMO: BotonPromo[] = [
  {
    imagen: "/judimental/1.png",
    alt: "Descargar JudiMental en el App Store",
    href: "https://apps.apple.com/my/app/judimental/id6807611985",
  },
  {
    imagen: "/judimental/2.png",
    alt: "Descargar JudiMental en Google Play",
    href: "https://play.google.com/store/apps/details?id=com.judomarketing.juniapp&pcampaignid=web_share",
  },
  {
    imagen: "/judimental/3.png",
    alt: "Visitar judomarketing.net",
    href: "https://www.judomarketing.net",
  },
];
