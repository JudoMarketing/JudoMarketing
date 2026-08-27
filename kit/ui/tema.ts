/**
 * Judo Site Kit · El tema de un sitio de cliente.
 *
 * La regla del cerebro de diseño (docs/CEREBRO.md §6) es que se elige UN
 * color dueño y todo lo demás se deriva de él. Esto es esa regla en código:
 * se pasa el color de la marca del cliente y sale la paleta completa como
 * variables CSS, para que cambiar una línea repinte el sitio entero.
 *
 * Autocontenido a propósito: sin dependencias, sin Tailwind. Se copia tal
 * cual al proyecto del cliente.
 */

export type Modo = "oscuro" | "claro";

export type Paleta = {
  /** El color de la marca del cliente, tal cual se eligió */
  marca: string;
  /** Versión clara de la marca: para texto de acento sobre fondo oscuro */
  marcaLuz: string;
  /** Versión profunda: hover de botones, sombras */
  marcaHonda: string;
  /** Color del texto que va ENCIMA de un botón de marca */
  sobreMarca: string;
  fondo: string;
  /** Superficies que se despegan del fondo: tarjetas, encabezado pegado */
  fondoAlto: string;
  texto: string;
  /** Texto secundario. Decorativo o de apoyo, nunca información crítica */
  tenue: string;
  borde: string;
  /** Sombra de color, no negra (CEREBRO §6) */
  sombra: string;
};

/* ── Aritmética de color ────────────────────────────────────────────── */

type RGB = { r: number; g: number; b: number };

export function aRgb(hex: string): RGB {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function aHex({ r, g, b }: RGB): string {
  const dos = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0");
  return `#${dos(r)}${dos(g)}${dos(b)}`;
}

/** Mezcla dos colores. `peso` es cuánto del segundo entra (0 a 1). */
export function mezclar(a: string, b: string, peso: number): string {
  const x = aRgb(a);
  const y = aRgb(b);
  return aHex({
    r: x.r + (y.r - x.r) * peso,
    g: x.g + (y.g - x.g) * peso,
    b: x.b + (y.b - x.b) * peso,
  });
}

export function aclarar(color: string, peso: number): string {
  return mezclar(color, "#ffffff", peso);
}

export function oscurecer(color: string, peso: number): string {
  return mezclar(color, "#000000", peso);
}

export function transparente(color: string, alfa: number): string {
  const { r, g, b } = aRgb(color);
  return `rgba(${r}, ${g}, ${b}, ${alfa})`;
}

/** Luminancia relativa (WCAG). */
function luminancia(color: string): number {
  const { r, g, b } = aRgb(color);
  const canal = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

/**
 * Razón de contraste entre dos colores, de 1 a 21.
 * Texto de lectura necesita 4.5 o más (CEREBRO §6 y §8).
 */
export function contraste(a: string, b: string): number {
  const la = luminancia(a);
  const lb = luminancia(b);
  const [alto, bajo] = la > lb ? [la, lb] : [lb, la];
  return (alto + 0.05) / (bajo + 0.05);
}

/** El color de texto que se lee encima de un fondo dado: negro o blanco. */
export function textoSobre(fondo: string): string {
  return contraste(fondo, "#ffffff") >= contraste(fondo, "#111111") ? "#ffffff" : "#111111";
}

/**
 * Sube o baja el color hasta que contrasta lo suficiente con el fondo.
 * Sirve para el acento: el morado de marca sobre negro pasa el ojo pero no
 * pasa el contraste, y este es el ajuste mínimo que lo arregla.
 */
export function legibleSobre(color: string, fondo: string, minimo = 4.5): string {
  const haciaLaLuz = luminancia(fondo) < 0.4;
  let salida = color;
  for (let paso = 0; paso < 20 && contraste(salida, fondo) < minimo; paso++) {
    salida = haciaLaLuz ? aclarar(salida, 0.08) : oscurecer(salida, 0.08);
  }
  return salida;
}

/* ── La paleta ──────────────────────────────────────────────────────── */

/**
 * Construye la paleta completa a partir del color de la marca del cliente.
 *
 * ```ts
 * const tema = paletaDesde("#e0399b", "claro");
 * ```
 *
 * Claro u oscuro lo decide el rubro, no el gusto (CEREBRO §2.2): comida al
 * carbón, trading e industrial nocturno piden oscuro; salud, belleza, SaaS y
 * repostería piden aire claro.
 */
export function paletaDesde(marca: string, modo: Modo = "oscuro"): Paleta {
  const oscuro = modo === "oscuro";

  // "Oscuro no es negro" (CEREBRO §2.1): el fondo lleva un tinte de la marca
  // y nunca baja de #12, para que el texto secundario no se hunda.
  const fondo = oscuro ? mezclar("#141320", marca, 0.06) : mezclar("#ffffff", marca, 0.02);
  const fondoAlto = oscuro ? mezclar(fondo, "#ffffff", 0.07) : mezclar(fondo, marca, 0.05);
  const texto = oscuro ? "#f5f5f7" : mezclar("#111111", marca, 0.12);

  return {
    marca,
    marcaLuz: legibleSobre(marca, fondo),
    marcaHonda: oscurecer(marca, 0.18),
    sobreMarca: textoSobre(marca),
    fondo,
    fondoAlto,
    texto,
    tenue: transparente(texto, oscuro ? 0.62 : 0.66),
    borde: transparente(marca, oscuro ? 0.22 : 0.18),
    sombra: transparente(oscuro ? marca : oscurecer(marca, 0.35), 0.28),
  };
}

/** Los nombres de variable CSS, uno por color de la paleta. */
export function variablesDeTema(p: Paleta): Record<string, string> {
  return {
    "--marca": p.marca,
    "--marca-luz": p.marcaLuz,
    "--marca-honda": p.marcaHonda,
    "--sobre-marca": p.sobreMarca,
    "--fondo": p.fondo,
    "--fondo-alto": p.fondoAlto,
    "--texto": p.texto,
    "--tenue": p.tenue,
    "--borde": p.borde,
    "--sombra": p.sombra,
  };
}

/**
 * El bloque `:root` listo para pegar en el CSS global del cliente, o para
 * inyectar desde el layout:
 *
 * ```tsx
 * <style dangerouslySetInnerHTML={{ __html: cssDeTema(paletaDesde("#e0399b")) }} />
 * ```
 */
export function cssDeTema(p: Paleta, selector = ":root"): string {
  const filas = Object.entries(variablesDeTema(p))
    .map(([nombre, valor]) => `  ${nombre}: ${valor};`)
    .join("\n");
  return `${selector} {\n${filas}\n}`;
}

/**
 * Avisos de la paleta, para cantarlos en consola al construir el sitio en
 * vez de descubrirlos cuando el cliente ya lo vio.
 */
export function revisarPaleta(p: Paleta): string[] {
  const avisos: string[] = [];
  const texto = contraste(p.texto, p.fondo);
  if (texto < 4.5) avisos.push(`Texto sobre fondo: ${texto.toFixed(2)}:1, se necesita 4.5:1`);
  const acento = contraste(p.marcaLuz, p.fondo);
  if (acento < 4.5) avisos.push(`Acento sobre fondo: ${acento.toFixed(2)}:1, usar solo decorativo`);
  const boton = contraste(p.sobreMarca, p.marca);
  if (boton < 4.5) avisos.push(`Texto del boton sobre la marca: ${boton.toFixed(2)}:1`);
  if (aHex(aRgb(p.fondo)) === "#000000") avisos.push("Oscuro no es negro (CEREBRO §2.1)");
  return avisos;
}
