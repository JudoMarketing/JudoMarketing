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

const CUOTAS = (tabla as { cuotaInicio?: Partial<Record<Plan, number>> }).cuotaInicio ?? {};

/**
 * Cuota de inicio: un pago único que se cobra junto con el primer mes. Desde
 * el 2 de octubre de 2026 solo la lleva el Website Esencial ($130); los
 * Complejos se cotizan con todo dentro de la mensualidad y las Apps no la
 * llevan. Devuelve 0 cuando el plan no tiene cuota. Los clientes que ya
 * estaban suscritos no la pagan: solo entra en un checkout nuevo.
 */
export function cuotaInicio(plan: Plan): number {
  return CUOTAS[plan] ?? 0;
}

export function cuotaInicioTexto(plan: Plan): string {
  return `$${cuotaInicio(plan)}`;
}

/** Lo que se paga el primer día: el primer mes más la cuota de inicio. */
export function primerPago(plan: Plan): number {
  return precio(plan) + cuotaInicio(plan);
}

export function primerPagoTexto(plan: Plan): string {
  return `$${primerPago(plan)}`;
}
