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

/** Los dos servicios que se suman al website. */
export const PRECIO_JUDITOADS = tabla.extras.juditoads;
/**
 * Juditos: el plan base (hasta tres asistentes) y el Pro (razonamiento
 * complejo y memoria por cliente). Los manda la app de Juditos; aquí se
 * copian para que el sitio, el chatbot y los contratos digan lo mismo.
 */
export const PRECIO_ASISTENTE = tabla.extras.asistente;
export const PRECIO_ASISTENTE_PRO = tabla.extras.asistentePro;
/**
 * Lo que paga un cliente que terminó sus 12 meses y se queda alojado con
 * nosotros sin contratar más diseño ni cambios. Es la base: si su website
 * consume mucho más de lo normal, el contrato permite ajustarlo con aviso.
 */
export const PRECIO_HOSTING = tabla.extras.hosting;

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
