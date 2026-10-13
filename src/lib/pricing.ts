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
 * Cuota de inicio: un pago único que se cobra junto con el primer mes. El
 * Website Esencial la tuvo ($130) del 2 al 12 de octubre de 2026; desde el 13
 * ningún plan la lleva. Devuelve 0 cuando el plan no tiene cuota. Si vuelve,
 * basta con ponerla en pricing.json: el checkout y las páginas la recogen.
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
  return usd(primerPago(plan));
}

/** Dólares con separador de miles: $2,388. */
export function usd(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}

const ANTES = (tabla as { precioAntes?: Partial<Record<Plan, number>> }).precioAntes ?? {};

/**
 * Precio de referencia que se muestra tachado junto al vigente (desde el 13
 * de octubre de 2026, el Esencial: $300 tachado, $150 al mes). Null si el
 * plan no lo lleva.
 */
export function precioAntes(plan: Plan): number | null {
  return ANTES[plan] ?? null;
}

/** El descuento contra el precio de antes, en porcentaje entero (50). */
export function descuento(plan: Plan): number | null {
  const antes = precioAntes(plan);
  return antes ? Math.round((1 - precio(plan) / antes) * 100) : null;
}

const UNICO = (tabla as { pagoUnico?: Partial<Record<Plan, { meses: number; total: number }>> }).pagoUnico ?? {};

/**
 * Pago único: el contrato completo de una vez, por un total fijo que sale
 * más barato que las cuotas (desde el 13 de octubre de 2026, el Esencial:
 * $1,500 por los 12 meses, contra $1,800 pagando mes a mes). Lo contrario es
 * pagarlo en cuotas mensuales, que es el contrato de siempre. Devuelve null
 * si el plan no se ofrece así.
 */
export function pagoUnico(plan: Plan): { meses: number; total: number } | null {
  const p = UNICO[plan];
  return p ? { meses: p.meses, total: p.total } : null;
}

/** Lo que se ahorra pagando de una vez contra las cuotas (y su cuota de inicio). */
export function ahorroPagoUnico(plan: Plan): number {
  const p = pagoUnico(plan);
  return p ? Math.max(0, p.meses * precio(plan) + cuotaInicio(plan) - p.total) : 0;
}

export function pagoUnicoTexto(plan: Plan): string | null {
  const p = pagoUnico(plan);
  return p ? usd(p.total) : null;
}
