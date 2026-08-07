/**
 * Las redes de Judo Marketing, en un solo lugar.
 *
 * Los iconos van dibujados aquí mismo: no dependemos de ninguna librería
 * externa ni de imágenes que haya que cargar.
 */

/**
 * Enlace directo a la ficha de Judo Marketing en Google.
 *
 * Los enlaces de share.google y g.page abren una PÁGINA DE BÚSQUEDA con el
 * negocio al lado, no la ficha. Este va derecho al perfil en Google Maps.
 */
export const PERFIL_GOOGLE = "https://maps.google.com/?cid=17833491083157741838";

export const REDES = [
  {
    id: "instagram",
    nombre: "Instagram",
    usuario: "@judo.marketing",
    url: "https://www.instagram.com/judo.marketing/",
  },
  {
    id: "facebook",
    nombre: "Facebook",
    usuario: "Judo Marketing",
    url: "https://www.facebook.com/Judomarketi/",
  },
] as const;

export function IconoRed({ id, className = "h-5 w-5" }: { id: string; className?: string }) {
  if (id === "instagram") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
        <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 5.68a4.16 4.16 0 1 0 0 8.32 4.16 4.16 0 0 0 0-8.32Zm0 6.86a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4Zm5.3-7.02a.97.97 0 1 1-1.94 0 .97.97 0 0 1 1.94 0Z" />
      </svg>
    );
  }
  if (id === "facebook") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
        <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06C2 17.08 5.66 21.24 10.44 22v-7.02H7.9v-2.92h2.54V9.84c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.9h2.78l-.44 2.92h-2.34V22C18.34 21.24 22 17.08 22 12.06Z" />
      </svg>
    );
  }
  return null;
}
