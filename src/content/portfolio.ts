/**
 * Los trabajos que mostramos en el portafolio.
 *
 * Para agregar un cliente nuevo: copia un bloque, cambia los datos y deja la
 * imagen en public/portfolio. Nada más hay que tocar; la página y el filtro se
 * arman solos a partir de esta lista.
 */

export type Categoria = "food" | "delivery" | "tiendas" | "servicios";

export type Trabajo = {
  slug: string;
  nombre: string;
  url: string;
  dominio: string;
  imagen: string;
  categoria: Categoria;
  /** Se muestran como etiquetas pequeñas bajo la descripción. */
  etiquetas: { es: string[]; en: string[] };
  descripcion: { es: string; en: string };
};

/** El orden aquí es el orden en que aparecen. */
export const TRABAJOS: Trabajo[] = [
  {
    slug: "zanoah",
    nombre: "Zanoah",
    url: "https://zanoah.shop",
    dominio: "zanoah.shop",
    imagen: "/portfolio/zanoah.jpg",
    categoria: "food",
    etiquetas: {
      es: ["Tienda online", "Pedidos", "Delivery y pickup"],
      en: ["Online store", "Ordering", "Delivery & pickup"],
    },
    descripcion: {
      es: "Postres saludables en Miami: donas de proteína, banana bread y carrot cake sin azúcar refinada. Catálogo con pedidos en línea, delivery y pickup.",
      en: "Healthy desserts in Miami: protein donuts, banana bread, and carrot cake with no refined sugar. Product catalog with online ordering, delivery, and pickup.",
    },
  },
  {
    slug: "delivery-rush-florida",
    nombre: "Delivery Rush Florida",
    url: "https://www.deliveryrushflorida.com",
    dominio: "deliveryrushflorida.com",
    imagen: "/portfolio/delivery-rush.jpg",
    categoria: "delivery",
    etiquetas: {
      es: ["Cotizador", "Seguimiento", "SEO local"],
      en: ["Instant quotes", "Order tracking", "Local SEO"],
    },
    descripcion: {
      es: "Mensajería urgente en Miami y Orlando. Cotización según el tipo de vehículo, seguimiento del pedido y entregas en menos de dos horas.",
      en: "Rush courier service in Miami and Orlando. Quotes by vehicle type, order tracking, and deliveries in under two hours.",
    },
  },
];

/** Solo salen en el filtro las categorías que de verdad tienen trabajos. */
export const CATEGORIAS: { id: Categoria; es: string; en: string }[] = [
  { id: "food", es: "Comida y restaurantes", en: "Food & Restaurants" },
  { id: "delivery", es: "Apps de delivery", en: "Delivery apps" },
  { id: "tiendas", es: "Tiendas online", en: "Online stores" },
  { id: "servicios", es: "Servicios", en: "Services" },
];

export function categoriasConTrabajos() {
  return CATEGORIAS.filter((c) => TRABAJOS.some((t) => t.categoria === c.id));
}
