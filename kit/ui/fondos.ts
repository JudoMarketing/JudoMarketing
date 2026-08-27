/**
 * Judo Site Kit · Pintores para `JudoFondoVivo`.
 *
 * Fondos interactivos con el presupuesto de docs/CEREBRO.md §7: densidad
 * calculada por area (nunca un numero fijo de particulas), 8ms por fotograma
 * como tope, y nada que dependa del puntero para verse bien (en telefono no
 * hay puntero, y en telefono este fondo ni siquiera corre).
 */

import type { Pintor } from "./JudoFondoVivo";

export type OpcionesParticulas = {
  /** Color de las particulas. Por defecto toma el de la marca del tema. */
  color?: string;
  /** Particulas por cada 100.000 px2 de canvas. 6 es discreto, 14 es denso. */
  densidad?: number;
  /** Pixeles por segundo. Lento se ve caro; rapido se ve de plantilla. */
  velocidad?: number;
  /** Radio en px del area donde el puntero empuja. 0 lo desactiva. */
  alcance?: number;
};

/**
 * Polvo que flota y se aparta del puntero.
 *
 * ```tsx
 * <JudoFondoVivo poster="/hero.jpg" pintar={particulas({ densidad: 8 })}>
 *   <JudoHero ... />
 * </JudoFondoVivo>
 * ```
 */
export function particulas(opciones: OpcionesParticulas = {}): Pintor {
  const { color, densidad = 8, velocidad = 14, alcance = 140 } = opciones;

  type Punto = { x: number; y: number; dx: number; dy: number; r: number };
  let puntos: Punto[] = [];
  let medida = "";
  let anterior = 0;

  return (ctx, { ancho, alto, t, puntero }) => {
    // La densidad se recalcula cuando cambia el tamaño, no cuando cambia la
    // pantalla del visitante: lo que se ve bien en 27" ahoga un portatil.
    const huella = `${ancho}x${alto}`;
    if (huella !== medida) {
      medida = huella;
      const cuantas = Math.round(((ancho * alto) / 100_000) * densidad);
      puntos = Array.from({ length: Math.min(cuantas, 220) }, () => ({
        x: Math.random() * ancho,
        y: Math.random() * alto,
        dx: (Math.random() - 0.5) * 2,
        dy: (Math.random() - 0.5) * 2,
        r: 0.6 + Math.random() * 1.8,
      }));
    }

    const paso = Math.min((t - anterior) / 1000, 0.05); // Un salto de pestaña no teletransporta nada.
    anterior = t;

    ctx.clearRect(0, 0, ancho, alto);
    ctx.fillStyle =
      color ||
      getComputedStyle(document.documentElement).getPropertyValue("--marca-luz").trim() ||
      "#a855f7";

    for (const p of puntos) {
      p.x += p.dx * velocidad * paso;
      p.y += p.dy * velocidad * paso;

      if (puntero && alcance > 0) {
        const dx = p.x - puntero.x;
        const dy = p.y - puntero.y;
        const dist = Math.hypot(dx, dy);
        if (dist < alcance && dist > 0.01) {
          const empuje = (1 - dist / alcance) * 30 * paso;
          p.x += (dx / dist) * empuje;
          p.y += (dy / dist) * empuje;
        }
      }

      // Los bordes envuelven: sin muros invisibles ni acumulacion en esquinas.
      if (p.x < 0) p.x += ancho;
      if (p.x > ancho) p.x -= ancho;
      if (p.y < 0) p.y += alto;
      if (p.y > alto) p.y -= alto;

      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };
}
