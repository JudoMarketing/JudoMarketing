/**
 * Utilidades a prueba de navegadores hostiles.
 *
 * Por qué existen: los enlaces de Judo Marketing se abren muchas veces
 * dentro de Instagram, Facebook o WhatsApp, y en modo privado de iOS.
 * En esos navegadores localStorage puede lanzar error al tocarlo y
 * crypto.randomUUID a veces no existe. Sin protección, ese error tumba
 * toda la página en blanco.
 */

export function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* navegador sin almacenamiento: seguimos sin guardar */
  }
}

/** UUID con respaldo para navegadores viejos y webviews. */
export function safeUuid(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
      const b = crypto.getRandomValues(new Uint8Array(16));
      b[6] = (b[6] & 0x0f) | 0x40;
      b[8] = (b[8] & 0x3f) | 0x80;
      const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
      return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
    }
  } catch {
    /* cae al respaldo de abajo */
  }
  // Último recurso: suficiente para no repetir un id de visita
  const r = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, "0");
  return `${r()}${r()}-${r()}-4${r().slice(1)}-a${r().slice(1)}-${r()}${r()}${r()}`;
}
