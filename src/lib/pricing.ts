import tabla from "@/content/pricing.json";

/**
 * Los precios, en un solo lugar.
 *
 * Hubo una oferta de arranque que iba a vencer el 1 de septiembre de 2026. El
 * dueño la cerró antes y dejó los precios de lista corriendo, así que ya no
 * hay dos tablas ni fecha de corte: hay un precio y ya. Los clientes que
 * entraron con la oferta conservan el suyo, pero eso vive en cada website
 * (sites.monthly_price), no aquí.
 */

export const PLANES = ["essential", "complex", "apps"] as const;
export type Plan = (typeof PLANES)[number];

const PRECIOS = tabla.precios as Record<Plan, number>;

/** Los dos servicios que se suman al website y cuestan igual. */
export const PRECIO_JUDITOADS = tabla.extras.juditoads;
export const PRECIO_ASISTENTE = tabla.extras.asistente;

export function precio(plan: Plan): number {
  return PRECIOS[plan];
}

export function precioTexto(plan: Plan): string {
  return `$${precio(plan)}`;
}

/** El más barato, para los textos de tipo "desde $X". */
export function precioDesde(): string {
  return precioTexto("essential");
}
