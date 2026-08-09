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
  | "automotriz";

export type Trabajo = {
  nombre: string;
  dominio: string;
  url: string;
  imagen: string;
  categoria: Categoria | null;
  /** Un borrador se puede mostrar, pero se avisa que todavía no está entregado. */
  enDesarrollo: boolean;
  descripcion: { es: string; en: string };
};

export const CATEGORIAS: { id: Categoria; es: string; en: string }[] = [
  { id: "food", es: "Comida y restaurantes", en: "Food & Restaurants" },
  { id: "delivery", es: "Apps de delivery", en: "Delivery apps" },
  { id: "tiendas", es: "Tiendas online", en: "Online stores" },
  { id: "servicios", es: "Servicios", en: "Services" },
  { id: "fundaciones", es: "Fundaciones y ONG", en: "Nonprofits" },
  { id: "equipos", es: "Equipos e industria", en: "Equipment & industrial" },
  { id: "educacion", es: "Educación y cursos", en: "Education & courses" },
  { id: "automotriz", es: "Automotriz", en: "Automotive" },
];

/**
 * Captura del home. Se genera sola a partir del dominio, así que un website
 * nuevo ya trae su imagen sin que nadie suba nada. Si algún día hace falta
 * una imagen distinta, se guarda en el campo portfolio_image y esa manda.
 */
export function capturaDelHome(dominio: string, propia?: string | null): string {
  if (propia?.trim()) return propia.trim();
  const limpio = dominio.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  return `https://image.thum.io/get/width/900/crop/560/noanimate/https://${limpio}`;
}
