/**
 * Los precios de los tres planes, en un solo lugar.
 *
 * Hasta el 1 de septiembre de 2026 rige la oferta de 50%. A partir de esa
 * fecha el precio pasa solo al normal y la etiqueta de descuento desaparece
 * de todo el sitio: no hay que acordarse de tocar nada ese día.
 *
 * Las páginas que muestran precio se regeneran cada hora (`revalidate`), así
 * que el cambio entra a más tardar una hora después de medianoche.
 */

export const PLANES = ["essential", "complex", "apps"] as const;
export type Plan = (typeof PLANES)[number];

/** Precio de oferta (el que está corriendo ahora). */
const OFERTA: Record<Plan, number> = {
  essential: 50,
  complex: 100,
  apps: 150,
};

/** Precio normal: el doble. Entra solo el 1 de septiembre. */
const NORMAL: Record<Plan, number> = {
  essential: 100,
  complex: 200,
  apps: 300,
};

/**
 * 1 de septiembre de 2026, 00:00 en Miami. Septiembre cae en horario de
 * verano (EDT, UTC−4), por eso las 04:00 UTC.
 */
export const FIN_DE_OFERTA = Date.parse("2026-09-01T04:00:00Z");

/** ¿Sigue viva la oferta de 50%? */
export function ofertaVigente(ahora: number = Date.now()): boolean {
  return ahora < FIN_DE_OFERTA;
}

/** Lo que cuesta hoy este plan, en dólares. */
export function precio(plan: Plan, ahora: number = Date.now()): number {
  return ofertaVigente(ahora) ? OFERTA[plan] : NORMAL[plan];
}

/** Lo mismo, listo para pintar: "$50". */
export function precioTexto(plan: Plan, ahora: number = Date.now()): string {
  return `$${precio(plan, ahora)}`;
}

/** El más barato de todos, para los textos de "desde $X". */
export function precioDesde(ahora: number = Date.now()): string {
  return precioTexto("essential", ahora);
}
