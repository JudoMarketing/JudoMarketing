/**
 * Judo Site Kit · Textos en dos idiomas para los patrones de `kit/ui`.
 *
 * Un idioma por vista, completo (docs/CEREBRO.md §2.5): cada texto que ve el
 * visitante existe en los dos idiomas o no existe. Por eso los componentes
 * piden `{ es, en }` y no un string suelto: si falta uno, el compilador lo
 * dice antes de que lo diga el cliente.
 */

export type Idioma = "es" | "en";

/** Un texto que existe en los dos idiomas. */
export type Texto = { es: string; en: string };

/** El texto del idioma en curso. Acepta string cuando de verdad no se traduce
 *  (nombre del negocio, dirección, teléfono). */
export function t(valor: Texto | string, idioma: Idioma): string {
  return typeof valor === "string" ? valor : valor[idioma];
}
