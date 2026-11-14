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
 * Full Diagnostic (desde el 14 de noviembre de 2026): el diagnóstico completo
 * del website y de la presencia en internet de un negocio, en PDF, por un
 * solo pago. Se compra en /diagnostic y se entrega en días hábiles.
 */
export const PRECIO_DIAGNOSTICO: number = tabla.diagnostico.precio;
export const DIAS_DIAGNOSTICO: number = tabla.diagnostico.diasHabiles;
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
 * el 14 de noviembre de 2026, $500 en el Website Esencial y en las Apps; no
 * se cobra con el pago del año completo. Devuelve 0 cuando el plan no la
 * lleva. Se cambia en pricing.json: el checkout y las páginas la recogen.
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
 * Precio de referencia que se muestra tachado junto al vigente. Null si el
 * plan no lo lleva (desde el 14 de noviembre de 2026, ninguno: el Esencial
 * tuvo $300 tachado y $150 al mes del 13 de octubre al 13 de noviembre).
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
 * Pago único: el año del contrato de una vez, por el precio de 10 meses y sin
 * cuota de inicio (desde el 14 de noviembre de 2026: Esencial $2,500 y Apps
 * $4,500). Lo contrario es pagarlo en cuotas mensuales más la cuota de
 * inicio. Devuelve null si el plan no se ofrece así.
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

/** Los meses que se regalan pagando el año de una vez (12 por el precio de 10: 2). */
export function mesesGratisPagoUnico(plan: Plan): number {
  const p = pagoUnico(plan);
  return p ? Math.max(0, Math.round(p.meses - p.total / precio(plan))) : 0;
}
